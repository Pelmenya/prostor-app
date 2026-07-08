---
phase: 01-jwt-session-lifecycle
reviewed: 2026-07-03T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
    - src/app/(web)/layout.tsx
    - src/features/auth/index.ts
    - src/features/auth/lib/use-logout.test.ts
    - src/features/auth/ui/session-expired-listener/index.ts
    - src/features/auth/ui/session-expired-listener/session-expired-listener.test.tsx
    - src/features/auth/ui/session-expired-listener/session-expired-listener.tsx
    - src/shared/api/api-client.test.ts
    - src/shared/api/api-client.ts
    - src/shared/lib/platform/adapters/web-adapter.test.ts
    - src/test/setup.ts
findings:
    critical: 1
    warning: 6
    info: 2
    total: 9
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-07-03T00:00:00Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewed the JWT session-lifecycle hardening: the SESSION-04 forced-navigation feature
(`auth:session-expired` CustomEvent + `SessionExpiredListener`), the SESSION-02 single-flight
refresh lock in `api-client.ts`, and the regression tests added for SESSION-01/03/05
(`use-logout`, `WebAdapter`) plus the Node 22+/happy-dom `localStorage` test-infra workaround
in `src/test/setup.ts`.

The single-flight dedup logic itself (`refreshPromise`) is correctly race-free for **concurrent**
401s — the check-then-set section has no `await` boundary, so JS run-to-completion semantics
prevent two callers from both winning the lock. However, tracing the call chain into
`useLogout()` (which shares the same `useAuthStore.logout` action via `useAuth()`) surfaced a
real cross-flow race: an in-flight background token refresh can silently re-authenticate a user
_after_ they've explicitly logged out, because `tryRefreshTokens` never re-checks that the
session it started refreshing is still the one currently active before calling `setTokens`. This
is classified as a blocker below. Several smaller robustness and duplication issues are noted
as warnings, plus two low-risk maintainability items.

## Critical Issues

### CR-01: Background token refresh can resurrect a session after explicit logout

**File:** `src/shared/api/api-client.ts:96-136` (specifically the `setTokens` call at line 125)

**Issue:**
`tryRefreshTokens()` reads `refreshToken`/`logout`/`setTokens` once at the top of the function
and then, inside the async IIFE assigned to the module-level `refreshPromise`, unconditionally
calls `setTokens(data.accessToken, data.refreshToken)` once the `/auth/web/refresh` call
succeeds — with no check that the session is still the one that initiated the refresh.

`useLogout()` (`src/features/auth/lib/use-logout.ts:41`, exercised by
`src/features/auth/lib/use-logout.test.ts`) calls `useAuth().logout`, which is literally
`useAuthStore.getState().logout` (see `src/shared/lib/platform/hooks/use-auth.ts:21`) — the
_same_ store action `tryRefreshTokens` calls on failure.

Concrete race:

1. Some background request gets a 401, `tryRefreshTokens()` starts a refresh with the
   current `refreshToken` and is awaiting the `fetch` to `/auth/web/refresh`.
2. Before that fetch resolves, the user clicks "logout". `useLogout()` calls
   `webLogout(accessToken, refreshToken)` then `logout()`, which clears
   `accessToken`/`refreshToken`/`localStorage` and sets `isAuthenticated: false`. The user is
   redirected away believing they are logged out.
3. The in-flight refresh call from step 1 resolves successfully (the backend may not have
   revoked that specific refresh token yet, or may process the two requests out of order).
   `setTokens(data.accessToken, data.refreshToken)` runs, silently repopulating
   `accessToken`/`refreshToken` in the store **and in `localStorage`**, flipping
   `isAuthenticated` back to `true`.

The net effect: an explicit, user-initiated logout can be silently undone by a race with a
concurrent background refresh, leaving a "resurrected" authenticated session on a device the
user believed was logged out (a real concern on shared/public machines).

**Fix:** capture the refresh token identity the cycle started with, and re-verify it hasn't
changed (i.e. no logout / no newer refresh) immediately before persisting the new tokens:

```ts
refreshPromise = (async () => {
    const refreshTokenAtStart = refreshToken;
    try {
        const res = await fetch(`${BASE_URL}/auth/web/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        // Сессия могла быть завершена (logout()) или уже обновлена, пока
        // этот refresh был в полёте — не применяем устаревший результат.
        if (useAuthStore.getState().refreshToken !== refreshTokenAtStart) return;

        if (!res.ok) {
            logout();
            notifySessionExpired();
            return;
        }

        const data = await res.json();
        if (useAuthStore.getState().refreshToken !== refreshTokenAtStart) return;
        setTokens(data.accessToken, data.refreshToken);
    } catch {
        logout();
        notifySessionExpired();
    }
})();
```

## Warnings

### WR-01: `auth:session-expired` can be dispatched repeatedly for sequential post-logout requests

**File:** `src/shared/api/api-client.ts:96-103`

**Issue:** Once a session has expired/been cleared (`refreshToken` is `null`), _every_
subsequent request that gets a 401 independently re-enters `tryRefreshTokens()`, hits the
`if (!refreshToken)` branch, and calls `logout()` + `notifySessionExpired()` again — there is no
one-shot guard. `api-client.test.ts:184-237` even demonstrates this exact sequence (a second,
unrelated `/test2` call after the session already expired) but only asserts that no second
network refresh call happens; it does not assert `dispatchSpy` stays at 1 for that second call.
In a real app with several parallel TanStack Query subscriptions, an expired session can produce
a burst of `auth:session-expired` events, each triggering `SessionExpiredListener`'s
`router.push('/login?...')` — redundant navigations/history entries while the redirect from the
first event is still in flight.

**Fix:** short-circuit once already logged out, e.g. track a module-level
`sessionExpiredNotified` flag reset only when a new refresh cycle successfully starts:

```ts
let sessionExpiredNotified = false;

function notifySessionExpired(): void {
    if (sessionExpiredNotified) return;
    sessionExpiredNotified = true;
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }
}
```

(reset `sessionExpiredNotified = false` wherever `setTokens` succeeds, e.g. in `WebAdapter`/login flow).

### WR-02: No validation of the `/auth/web/refresh` response shape before persisting tokens

**File:** `src/shared/api/api-client.ts:124-125`

**Issue:** `const data = await res.json(); setTokens(data.accessToken, data.refreshToken);` trusts
the response body unconditionally. If the backend ever returns a 200 with a missing/renamed
field (deploy skew, proxy error page with `content-type: application/json`, etc.), `setTokens`
gets called with `undefined` values. The store's `localStorage.setItem` coerces via `String()`,
so `localStorage` would end up holding the **literal string `"undefined"`** as the access/refresh
token, which then gets read back by `initAuthFromStorage()` on the next load as a "valid"
non-empty token — a corrupted, hard-to-diagnose auth state.

**Fix:** guard before persisting:

```ts
const data = await res.json();
if (typeof data?.accessToken !== 'string' || typeof data?.refreshToken !== 'string') {
    logout();
    notifySessionExpired();
    return;
}
setTokens(data.accessToken, data.refreshToken);
```

### WR-03: `refreshPromise` reset is not exception-safe

**File:** `src/shared/api/api-client.ts:110-135`

**Issue:** `refreshPromise = null;` (line 133) only runs if `await refreshPromise;` (line 132)
doesn't throw. The inner IIFE currently always resolves (all internal errors are caught inside
its own `try/catch`), so this doesn't manifest today — but there's no structural guarantee. If
`logout()`, `setTokens()`, or `notifySessionExpired()` themselves ever throw (e.g. a future
change wraps `document.cookie` access in a way that can throw, or a test double misbehaves), the
IIFE's promise rejects, `refreshPromise` is left pointing at an already-rejected promise forever,
and every subsequent request's 401-handling (`await tryRefreshTokens()` in `apiClient`, which is
itself not wrapped in try/catch) will throw an unhandled rejection instead of a normal `ApiError`.

**Fix:** use `try/finally` to guarantee the reset regardless of outcome:

```ts
refreshPromise = (async () => { ... })();
try {
    await refreshPromise;
} finally {
    refreshPromise = null;
}
return !!useAuthStore.getState().accessToken;
```

### WR-04: `isPrivate` path-matching logic duplicated verbatim

**File:** `src/features/auth/ui/session-expired-listener/session-expired-listener.tsx:22-24`
(duplicate of `src/features/auth/lib/use-logout.ts:44`)

**Issue:**

```ts
const isPrivate = PRIVATE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
```

is copy-pasted identically in both files. CLAUDE.md explicitly calls this out as a hard rule:
"Не дублировать логику. Общие паттерны... выносить в хуки/утилиты в features или shared." Any
future change to the private-path matching rule (e.g. adding case-insensitivity, trailing-slash
normalization) now has to be made in two places, and it's easy to update one and miss the other.

**Fix:** extract to a shared helper, e.g. `src/shared/lib/is-private-path.ts`:

```ts
export function isPrivatePath(pathname: string): boolean {
    return PRIVATE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
```

and import it from both `use-logout.ts` and `session-expired-listener.tsx`.

### WR-05: `src/test/setup.ts` storage-polyfill guard doesn't cover the "throws" case its own comment describes

**File:** `src/test/setup.ts:29-37`

**Issue:** The header comment states Node 22+'s experimental global storage "throws/resolves to
undefined unless `--localstorage-file` is passed," but the guard only defends against the
"resolves to undefined" branch:

```ts
for (const key of ['localStorage', 'sessionStorage'] as const) {
    if (!globalThis[key]) { ... }
}
```

If `globalThis[key]` is a getter that **throws** synchronously on access (which is the documented
behavior on some Node 22.x releases, before it was softened to a warning+`undefined` in later
versions — confirmed empirically to currently resolve to `undefined` with a warning on the
Node version in this environment, but the comment itself flags this as version-dependent), the
mere truthiness check `!globalThis[key]` throws, and `setup.ts` — which runs before every test
file — crashes the entire suite instead of installing the fallback it exists to provide. This is
exactly the kind of test-infra fix that should be defensive against the very failure mode it was
written to work around.

**Fix:**

```ts
for (const key of ['localStorage', 'sessionStorage'] as const) {
    let existing: unknown;
    try {
        existing = globalThis[key];
    } catch {
        existing = undefined;
    }
    if (!existing) {
        Object.defineProperty(globalThis, key, {
            value: createMemoryStorage(),
            writable: true,
            configurable: true,
        });
    }
}
```

Separately: `vitest.config.ts`'s `poolOptions.forks.execArgv: ['--no-experimental-webstorage']`
appears to address the same root cause via a different mechanism (a Node flag that removes the
`localStorage` property from `globalThis` entirely, per manual verification with `'localStorage'
in globalThis`). Having two independent, undocumented-as-redundant fixes for one root cause makes
it unclear which one is load-bearing; if a future change silently drops the `execArgv` flag,
`setup.ts` is the only thing standing between the suite and a hard crash, but nothing says so.
Worth a comment cross-referencing the two, or consolidating to one mechanism.

### WR-06: `api-client.test.ts`'s `afterEach` doesn't clear `localStorage` between tests in the same file

**File:** `src/shared/api/api-client.test.ts:26-29` (contrast with the single-flight test at
lines 110-182, which triggers a real `setTokens()` call that writes to `localStorage`)

**Issue:** `afterEach(() => { vi.restoreAllMocks(); useAuthStore.setState(initialAuthState,
true); })` only resets the **in-memory** Zustand state. The single-flight test causes
`tryRefreshTokens` to call `setTokens('new-access', 'new-refresh')`, which writes those values to
the (module-scoped, in-memory-Map-backed) polyfilled `localStorage` via
`localStorage.setItem(ACCESS_TOKEN_KEY, ...)`. Nothing in this file's `afterEach`/`beforeEach`
removes those keys, so `localStorage` carries stale `prostor_access_token` /
`prostor_refresh_token` entries for the rest of the file. It happens not to matter today because
no other test in this file reads `localStorage` directly (all reads go through the
already-initialized `useAuthStore` singleton), but it's a latent test-isolation gap: any new test
added later that reads storage directly, or that exercises `initAuthFromStorage()`-style
re-initialization, will silently inherit leftover data from an unrelated test.

**Fix:** clear storage alongside the store reset:

```ts
afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState(initialAuthState, true);
    localStorage.clear();
});
```

## Info

### IN-01: `'auth:session-expired'` event name duplicated as a magic string

**File:** `src/shared/api/api-client.ts:40`, `src/features/auth/ui/session-expired-listener/session-expired-listener.tsx:30`

**Issue:** The event name string is hand-typed identically in the dispatcher and the listener
with no shared constant. A future rename/typo in either location would silently break the
redirect-on-expiry flow with no compile-time signal.

**Fix:** extract a shared constant, e.g. in `src/shared/config`:

```ts
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';
```

and use it in both `notifySessionExpired()` and `SessionExpiredListener`'s
`addEventListener`/`removeEventListener` calls.

### IN-02: Inconsistent base-URL resolution between the main request path and the refresh path

**File:** `src/shared/api/api-client.ts:63` vs `src/shared/api/api-client.ts:112`

**Issue:** The main request builds its URL via `getBaseUrl()` (which differentiates
server/client), while `tryRefreshTokens` hardcodes `BASE_URL` directly. This is harmless today
because `tryRefreshTokens` is only ever invoked when `typeof window !== 'undefined'` (so
`getBaseUrl()` would resolve to the same `BASE_URL` value anyway), but it's an easy-to-miss
inconsistency for anyone extending SSR support later.

**Fix:** use `getBaseUrl()` in `tryRefreshTokens` too, for a single source of truth.

---

_Reviewed: 2026-07-03T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
