# Phase 1: JWT Session Lifecycle - Research

**Researched:** 2026-07-03
**Domain:** Frontend JWT session management (token storage, single-flight refresh, forced logout) in a Next.js 16 / React 19 FSD app with no NextAuth
**Confidence:** HIGH (codebase-grounded; almost all claims verified by direct source inspection, not framework-generic assumption)

<phase_requirements>

## Phase Requirements

| ID         | Description                                                                                                                | Research Support                                                                                                                                                                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SESSION-01 | Все защищённые запросы отправляются с `Authorization: Bearer <accessToken>`                                                | Already implemented via `WebAdapter.getAuthHeader()` + `useApi()`/`apiClient()` — see Architecture Patterns diagram and Open Question 3 (audit the 3 call sites that bypass `useApi()`). Test gap in `web-adapter.test.ts` documented in Validation Architecture |
| SESSION-02 | При 401 фронт один раз вызывает `POST /auth/web/refresh`; параллельные refresh-запросы объединяются в один (single-flight) | Existing `refreshPromise` singleton in `api-client.ts` — see Pattern 1 and Pitfall 1 for correctness reasoning + hardening recommendation (drop the `await import()` indirection). Regression test pattern given in Code Examples                                |
| SESSION-03 | Успешный refresh заменяет обе пары — `accessToken` и `refreshToken`                                                        | Already implemented (`setTokens(data.accessToken, data.refreshToken)` in the refresh success branch) — see Pattern 1. Needs a regression test (Validation Architecture, Wave 0)                                                                                  |
| SESSION-04 | Если refresh тоже вернул 401 — токены очищаются, пользователь перенаправляется на страницу входа                           | **Real implementation gap.** Token clearing (`logout()`) already works; navigation does not exist yet — see Pitfall 2 for the concrete gap and two implementation options (Open Question 1 for which to pick)                                                    |
| SESSION-05 | Пользователь может выйти; локальная сессия очищается независимо от результата запроса                                      | Already implemented in `use-logout.ts` (try/catch around `webLogout`, `logout()` always called after) — no test file exists yet, see Validation Architecture Wave 0 gap and Code Examples for the test pattern                                                   |

</phase_requirements>

## Summary

**This is not a greenfield phase.** Direct inspection of the working tree (not just `.planning/codebase/*` docs, which are partially stale) shows that `POST /auth/web/login`, `/auth/web/register`, `/auth/web/refresh`, `/auth/web/logout` are already wired end-to-end and live in the app: `src/shared/api/api-client.ts` already implements a 401→refresh→retry interceptor with a module-level `refreshPromise` single-flight lock, `src/shared/lib/auth/auth-store.ts` already stores `accessToken`/`refreshToken`/`user` in `localStorage` plus a mirrored non-httpOnly cookie for SSR gating, `src/shared/lib/platform/adapters/web-adapter.ts` already reads real tokens from that store (no dev-token — `NEXT_PUBLIC_DEMO_TOKEN` no longer appears anywhere in `src/`), and full login/register/reset-password/verify-email pages already exist and are tested under `src/views/auth/`. Git history shows this landed via `feat: JWT web-авторизация (login, register, refresh, logout)` (#6) and related PRs **before** this GSD milestone's planning docs were written. `.planning/codebase/CONCERNS.md` describing "0% implemented" / dev-token-in-use is stale relative to the current tree.

**What this means for planning:** Phase 1 is an **audit-and-harden phase**, not a build-from-scratch phase. SESSION-01, SESSION-03, and SESSION-05 already appear functionally satisfied by existing code and mostly need **verification + regression tests** (the tests that exist today don't actually cover the refresh/dedup/logout-on-failure paths — `.planning/codebase/CONCERNS.md`'s "Test Coverage Gaps" section is accurate on this point even though its "0% implemented" framing is not). SESSION-02 has a working-but-untested single-flight lock with one code-smell (unnecessary `await import()` indirection) worth tightening. **SESSION-04 has a real, concrete implementation gap**: on terminal refresh failure the code calls `logout()` (which clears store + localStorage + the `access_token` cookie) but never navigates the user anywhere — a user mid-session on a private page sees silently-broken data until their next full navigation trips the `proxy.ts` middleware. This is the one genuinely new piece of logic this phase must build.

**Primary recommendation:** Do not rewrite `api-client.ts` or `auth-store.ts`. Treat this phase as: (1) verify SESSION-01/03/05 with new regression tests against the _existing_ implementation, (2) harden + regression-test the SESSION-02 single-flight lock, (3) add the missing forced-navigation-on-terminal-401 behavior for SESSION-04, reusing the existing `getSafeRedirect` helper pattern already used by `login-page.tsx`.

## Architectural Responsibility Map

| Capability                                           | Primary Tier                                                               | Secondary Tier                                     | Rationale                                                                                                                                                                                   |
| ---------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token storage & persistence                          | Browser / Client                                                           | —                                                  | No NextAuth/httpOnly session tier exists or is planned (explicitly out of scope, PROJECT.md); `useAuthStore` (Zustand, client-only) is the sole source of truth, mirrored to `localStorage` |
| Bearer header injection on requests                  | Browser / Client (`shared/api`, `shared/lib/platform`)                     | —                                                  | `apiClient()`/`useApi()`/`WebAdapter.getAuthHeader()` run only in the browser tab; no BFF/edge layer intercepts requests                                                                    |
| Single-flight token refresh                          | Browser / Client                                                           | API / Backend (issues new pair, enforces rotation) | Client owns request-timing/coordination; backend is the authority that invalidates the old refresh token                                                                                    |
| Route-level session gating (pre-navigation)          | Frontend Server (`proxy.ts` middleware, Next 16's renamed `middleware.ts`) | Browser / Client (in-session)                      | `proxy.ts` runs at the edge/server boundary on navigation using a _presence-only_ cookie check; it cannot see in-session token expiry that happens without a full navigation                |
| In-session forced logout / redirect (SESSION-04 gap) | Browser / Client                                                           | —                                                  | Must be triggered from `apiClient`/`tryRefreshTokens`, which runs client-side only; no server round-trip is involved in detecting this                                                      |
| Logout (local clear + best-effort server call)       | Browser / Client                                                           | API / Backend (best-effort token invalidation)     | SESSION-05 explicitly requires local clear to be network-result-independent, i.e. client is the source of truth for "am I logged out"                                                       |

## Standard Stack

### Core

No new dependencies are required for this phase. Everything SESSION-01..05 needs is already installed and already wired:

| Library              | Version (installed)              | Purpose                                                         | Why Standard (for this codebase)                                                                                                                            |
| -------------------- | -------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zustand              | 5.0.11 [VERIFIED: package.json]  | `useAuthStore` — client session state, manual localStorage sync | Already the project's client-state convention (also used by cart, checkout stores)                                                                          |
| native `fetch`       | —                                | `apiClient()` HTTP wrapper, 401→refresh→retry                   | Project has no axios; hand-rolled fetch wrapper is the established pattern, don't introduce axios/ky for this                                               |
| TanStack React Query | 5.90.21 [VERIFIED: package.json] | Downstream consumers of `apiClient`/`useApi` (entity hooks)     | Already project-wide; `retry: 1` default (query-client.ts) sits _on top of_ `apiClient`'s own single `_retry`, doesn't need special handling (see Pitfalls) |

### Supporting

| Library         | Version | Purpose | When to Use |
| --------------- | ------- | ------- | ----------- |
| (none required) | —       | —       | —           |

### Alternatives Considered

| Instead of                                                  | Could Use                                                                        | Tradeoff                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Module-level `refreshPromise` singleton (current)           | A refresh-lock library (e.g. `axios-auth-refresh`, a generic mutex package)      | Not applicable — project uses native `fetch`, not axios; a generic mutex adds a dependency for ~10 lines of already-correct logic. Don't introduce one.                                                                                                                                                                                                                                |
| Manual localStorage read/write in `auth-store.ts` (current) | Zustand `persist` middleware                                                     | `persist` would be a drop-in equivalent (project already uses it for `useCartStore`), but rewriting `auth-store.ts` to use it is a refactor with no behavior change requested by any SESSION-\* requirement — out of scope for this phase unless a bug is found in the manual approach during testing                                                                                  |
| Reactive-only 401 detection (current)                       | Pre-flight `exp` claim check before each request (`jwt-decode` or manual `atob`) | Would close the cosmetic "401 console noise" bug (`docs/backlog/401-auth-refresh-console-noise.md`) but is explicitly **not** a SESSION-01..05 requirement. If picked up opportunistically, use `jwt-decode` (4.0.0 on npm [ASSUMED — not verified via Context7/official docs this session, only npm registry existence]), never hand-roll base64url JWT parsing (see Don't Hand-Roll) |

**Installation:** None required.

## Package Legitimacy Audit

Not applicable — this phase installs no new packages. If a future phase (or this one, opportunistically) adds `jwt-decode` for the pre-flight expiry check mentioned above, run the Package Legitimacy Gate on it first (`npm view jwt-decode version` confirmed `4.0.0` exists on the registry [VERIFIED: npm registry] at time of this research, but the package name itself was sourced from training knowledge, not Context7/official docs, so it is tagged `[ASSUMED]` per the package-name provenance rule until independently confirmed).

## Architecture Patterns

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│  Browser tab (client-only — no NextAuth/BFF session tier)              │
│                                                                          │
│  Component / entity hook                                                │
│     │ useApi()  ──┐  (19 call sites)          direct apiClient() call  │
│     ▼             │                             (features/auth,        │
│  useAuth() ────────┤                             push-notifications,   │
│     │  authHeader  │                             cart-backend-sync)    │
│     ▼             │                                    │               │
│  WebAdapter                                             │               │
│  .getAuthHeader()                                       │               │
│     │ reads accessToken from useAuthStore                              │
│     ▼             ▼                                    ▼               │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  apiClient(path, { auth: 'Bearer <accessToken>' })                │ │
│  │    fetch(BASE_URL + path, { headers: { Authorization }, ... })    │ │
│  └───────────────────────────┬──────────────────────────────────────┘ │
│                               │ 401 && !_retry                         │
│                               ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  tryRefreshTokens()                                                │ │
│  │   if (refreshPromise) → await existing in-flight promise (JOIN)   │ │
│  │   else → refreshPromise = fetch POST /auth/web/refresh            │ │
│  │            { refreshToken } → { accessToken, refreshToken }       │ │
│  │            success → setTokens(BOTH new tokens)      [SESSION-03] │ │
│  │            failure/network-error → logout()                       │ │
│  │                                     [SESSION-04: MISSING — no nav]│ │
│  └───────────────────────────┬──────────────────────────────────────┘ │
│                               │ success                                │
│                               ▼                                        │
│               apiClient retries original request once (_retry: true)  │
│                                                                          │
│  ── separate, coordinated mechanism ──                                 │
│  useAuthStore.setTokens()/.logout() also mirror a NON-httpOnly         │
│  `access_token` cookie (1-day TTL, presence-only, NOT the real         │
│  expiry) consumed by proxy.ts (Next 16 middleware) on NAVIGATION only: │
│  private path + no cookie → redirect /login; auth path + cookie →     │
│  redirect /. This does NOT fire for in-session (no-navigation) token   │
│  loss — that's exactly the SESSION-04 gap above.                       │
└────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

No new FSD slices needed. This phase's work lands entirely in three existing files plus their test files:

```
src/shared/api/
├── api-client.ts            # harden tryRefreshTokens(): fix dynamic-import indirection,
│                             #   add forced-navigation on terminal refresh failure
└── api-client.test.ts       # ADD: single-flight dedup test, both-tokens-replaced test,
│                             #      terminal-401 → logout+redirect test
src/shared/lib/auth/
├── auth-store.ts            # verify only — logout()/setTokens() already correct
└── auth-store.test.ts       # already covers setTokens/setUser/logout — no change needed
src/shared/lib/platform/adapters/
├── web-adapter.ts            # verify only — already correct
└── web-adapter.test.ts       # ADD: positive case — getAuthHeader() returns
│                             #      `Bearer <token>` when accessToken is set (currently
│                             #      only the "no token" negative case is tested)
src/features/auth/lib/
├── use-logout.ts             # verify only — already network-failure-tolerant
└── use-logout.test.ts        # DOES NOT EXIST — create it (SESSION-05 coverage gap)
```

### Pattern 1: Single-flight refresh via module-scope Promise singleton

**What:** A module-level `let refreshPromise: Promise<void> | null` that the first caller sets and all subsequent concurrent callers `await` instead of triggering their own fetch.

**When to use:** Exactly this project's situation — a hand-rolled fetch client (not axios) needing to collapse N concurrent 401s into exactly 1 `POST /auth/web/refresh` call, because the refresh token rotates and reusing/racing it would invalidate concurrent requests.

**Current implementation (already in place, `src/shared/api/api-client.ts:85-123`):**

```typescript
// Source: src/shared/api/api-client.ts (existing code, verified in this repo)
let refreshPromise: Promise<void> | null = null;

async function tryRefreshTokens(): Promise<boolean> {
    const { useAuthStore } = await import('@/shared/lib/auth');
    const { refreshToken, logout, setTokens } = useAuthStore.getState();

    if (!refreshToken) {
        logout();
        return false;
    }

    if (refreshPromise) {
        await refreshPromise;
        return !!useAuthStore.getState().accessToken;
    }

    refreshPromise = (async () => {
        try {
            const res = await fetch(`${BASE_URL}/auth/web/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });
            if (!res.ok) {
                logout();
                return;
            }
            const data = await res.json();
            setTokens(data.accessToken, data.refreshToken);
        } catch {
            logout();
        }
    })();

    await refreshPromise;
    refreshPromise = null;
    return !!useAuthStore.getState().accessToken;
}
```

**[VERIFIED: src/shared/api/api-client.ts]** — this correctly dedupes concurrent refresh attempts _in the common case_ (see Pitfall 1 for the one edge case worth tightening) and correctly replaces both tokens on success (SESSION-03 satisfied). What it does **not** do: navigate anywhere on terminal failure (SESSION-04 gap).

### Anti-Patterns to Avoid

- **Rewriting the single-flight lock as a request queue class:** The "queue pending requests, replay after refresh" pattern from generic axios-interceptor tutorials is overkill here — `apiClient`'s recursive retry-with-`_retry`-flag already achieves the same outcome with less code, because each caller independently awaits the shared `refreshPromise` and then retries itself. Don't introduce a separate request queue.
- **Calling `useRouter()` inside `api-client.ts`:** `api-client.ts` is a plain module, not a React component/hook — it cannot call `next/navigation`'s `useRouter()`. The SESSION-04 fix must use either `window.location.href` or a `CustomEvent` + a listener registered in a client component (see Pitfall 2).
- **Treating the `access_token` cookie as the auth source:** It's a presence-only mirror for `proxy.ts` SSR gating (1-day arbitrary TTL, unrelated to the real ~15min access-token expiry). All actual API authorization uses the `Authorization: Bearer` header sourced from the Zustand store, never that cookie. Don't add new logic that reads it for anything but middleware routing decisions.

## Don't Hand-Roll

| Problem                                                                                            | Don't Build                                            | Use Instead                                                                                                                                                                                          | Why                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JWT payload decoding (only if a pre-flight expiry check is added — not required by SESSION-01..05) | Manual `atob(token.split('.')[1])` + `JSON.parse`      | `jwt-decode` [ASSUMED — package name from training knowledge, not yet independently verified via Context7/official docs]                                                                             | base64url vs base64 padding, unicode characters in claims, and malformed-token handling are easy to get subtly wrong by hand; decode-only (no signature check needed client-side) is exactly `jwt-decode`'s scope                  |
| Open-redirect-safe `from`/`next` query param handling                                              | A new ad-hoc redirect sanitizer for the SESSION-04 fix | Reuse `getSafeRedirect()` from `src/shared/lib/get-safe-redirect.ts` [VERIFIED: src/shared/lib/get-safe-redirect.ts] — already validates path starts with `/`, rejects `//`, `/\`, and `javascript:` | This exact utility already exists and is already used by `login-page.tsx` for the same class of problem (redirecting back to `from` after auth) — duplicating it for the forced-logout redirect would be inconsistent and untested |
| Refresh-request mutex/dedup                                                                        | A generic promise-mutex or `p-limit`-style dependency  | The existing module-scope `refreshPromise` singleton pattern                                                                                                                                         | Already correctly solves this project's exact concurrency shape; a generic library adds a dependency for a problem already solved in ~15 lines                                                                                     |

**Key insight:** Nearly everything this phase needs already exists in a hand-rolled, project-fit form. The risk here is not "under-building" (reaching for heavier libraries than needed) but "duplicate-building" (re-implementing logic that's already correct because the planner doesn't know it exists).

## Common Pitfalls

### Pitfall 1: Single-flight lock has an unnecessary async indirection (code smell, not a confirmed bug)

**What goes wrong:** `tryRefreshTokens()` does `const { useAuthStore } = await import('@/shared/lib/auth')` as its very first line, _before_ checking `if (refreshPromise)`. Since this is an `await`, it yields to the microtask queue before the dedup check runs.

**Why it happens:** The dynamic import looks defensive (avoids a static import cycle) but `@/shared/lib/auth` is already statically imported by `web-adapter.ts`, which must be instantiated for the app to function at all — by the time any `apiClient` call happens, that module is already loaded and cached. The dynamic import buys nothing except an extra async hop.

**How to avoid:** Reasoning through JS's microtask-queue ordering (FIFO), two calls that both start their dynamic import in the same synchronous burst will have their imports resolve in call order, so the dedup check for the _second_ call still correctly observes the _first_ call's `refreshPromise` assignment (which happens synchronously right after the first call's import resolves, before it yields again on `fetch`). **In practice this makes the current dedup logic sound for realistic concurrent-401 bursts** — but this reasoning is intricate enough that it deserves a locked-in regression test (see Code Examples) rather than being trusted by inspection alone, and the `await import()` should be replaced with a static `import` at the top of the file to remove the indirection and the associated (even if currently benign) risk surface.

**Warning signs:** If this phase's regression test for SESSION-02 (see below) is flaky or ever shows more than 1 call to `/auth/web/refresh` for concurrent 401s, this is the first place to look.

### Pitfall 2: SESSION-04 has no navigation — the actual gap to build

**What goes wrong:** `tryRefreshTokens()`'s failure branches (`!res.ok` and the `catch`) call `logout()`, which clears `accessToken`/`refreshToken`/`user` from the store, clears the three `localStorage` keys, and deletes the `access_token` cookie [VERIFIED: src/shared/lib/auth/auth-store.ts]. **It does not navigate the browser anywhere.** A user who is mid-session on e.g. `/orders` when their refresh token is finally rejected will see the store flip to unauthenticated, but any already-rendered page content stays on screen; they only get redirected to `/login` on their _next_ full navigation, when `proxy.ts` middleware sees the missing cookie.

**Why it happens:** `api-client.ts` is a plain module with no access to `next/navigation`'s router, and no cross-module signal (event, subscription) currently exists to notify a mounted React tree that a forced logout happened.

**How to avoid:** Add a forced-navigation mechanism triggered from the failure branches of `tryRefreshTokens()`. Two viable options — **this is an open decision, not locked by CONTEXT.md, flag for the planner/user:**

- **Option A (recommended default): `CustomEvent` + listener in a root client component.** Dispatch `window.dispatchEvent(new CustomEvent('auth:session-expired'))` from `tryRefreshTokens()`'s failure branches; register a listener once (e.g. in the `(web)` layout's client wrapper or a small provider) that calls `router.push(getSafeRedirect(...))` reusing the existing safe-redirect utility. Matches the SPA feel the rest of the app already has (login-page.tsx, reset-password-page.tsx already use `router.push`), avoids a full reload, and lets in-flight UI (toasts, etc.) coexist.
- **Option B (simpler, more bulletproof, worse UX): `window.location.href = '/login?from=...'` directly inside `tryRefreshTokens()`.** No listener wiring, no risk of a dispatched event having no mounted listener (edge case: extremely early failure before the app layout mounts), but forces a full page reload, discarding any unsaved client state.

Whichever is chosen, guard against redirect loops (don't fire if already on `/login`) and reuse `getSafeRedirect()` for the `from` param rather than reimplementing its validation.

**Warning signs:** Manual test — log in, let the refresh token be invalidated server-side (or wait past its lifetime), stay on a private page, trigger any protected request, and observe whether you land on `/login` without a manual navigation.

### Pitfall 3: `access_token` cookie TTL (1 day) is decoupled from real access-token lifetime (~15 min)

**What goes wrong:** `setCookie(ACCESS_TOKEN_COOKIE, access, 1)` sets a 1-day expiry unconditionally, regardless of the actual JWT's `exp` claim (~15 min per PROJECT.md). This is **by design, not a bug** — the cookie is a presence-only signal for `proxy.ts`, and the real authorization always goes through the `Authorization` header, which is re-validated against actual expiry on every request via the 401→refresh flow.

**Why it happens:** Intentional simplification — `proxy.ts` middleware can't verify JWT validity without importing a JWT library into edge middleware, so it deliberately only checks "is there a token at all."

**How to avoid:** Don't try to "fix" this by shortening the cookie TTL to match the access token — that would make `proxy.ts` incorrectly deny access to users with a perfectly valid session (refresh token still good, access token just expired, about to be silently refreshed). Leave this mechanism as-is; it is out of scope for SESSION-01..05, which are about the Bearer-header/refresh flow, not the SSR route guard.

### Pitfall 4: TanStack Query's own `retry: 1` layering on top of `apiClient`'s `_retry`

**What goes wrong (potential, not observed as a bug):** `query-client.ts` sets `retry: 1` project-wide [VERIFIED: src/shared/api/query-client.ts]. A query function that calls `apiClient()` and gets an `ApiError(401)` even after `apiClient`'s own single internal retry (because refresh itself failed) will surface that error to TanStack Query, which will retry the _whole query function_ once more — triggering a second, fresh `apiClient()` call (with `_retry` reset to `false` since it's a new top-level call) and therefore a second refresh attempt.

**Why it happens:** These are two independent retry layers that don't know about each other.

**How to avoid:** This is bounded (not an infinite loop — TanStack Query's `retry: 1` caps it at one extra attempt), but it does mean a hard-failed refresh can trigger the refresh endpoint twice in quick succession before the user is redirected. Once the SESSION-04 fix (Pitfall 2) forces navigation on the _first_ terminal failure, this second attempt becomes moot in practice (the store is already cleared, no refreshToken to retry with, so the second attempt's `tryRefreshTokens()` hits the `if (!refreshToken)` branch and returns `false` immediately without a second network call). Verify this behavior with a test rather than assuming it.

### Pitfall 5: Refresh/access tokens live in `localStorage`, exposed to XSS — accepted tradeoff, not a build task

**What goes wrong:** Per OWASP's JWT Cheat Sheet guidance [CITED: OWASP JWT Cheat Sheet, via web search aggregation, MEDIUM confidence — not read directly from owasp.org this session], tokens readable by `localStorage`/`sessionStorage` are readable by any script on the page — a single XSS hole exposes both tokens fully, unlike an httpOnly cookie which XSS cannot read.

**Why it happens:** This project explicitly rejected NextAuth (PROJECT.md, locked decision) because the backend contract returns bare `accessToken`/`refreshToken` in the JSON body rather than `Set-Cookie` headers — moving to httpOnly-cookie storage would require a backend contract change (issuing `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict` from `/auth/web/login`, `/auth/web/refresh`, etc.), which is explicitly out of scope for the frontend and not something this phase can unilaterally decide.

**How to avoid:** Do not attempt to migrate storage strategy in this phase — that's a backend-coordination-requiring architectural change, not a SESSION-01..05 task. Instead, treat this as an accepted, already-made tradeoff and recommend defense-in-depth within frontend scope: keep CSP headers tight (if any exist — verify in a follow-up if not covered elsewhere), and audit that no user-controlled string is ever rendered unsanitized (the codebase uses `react-markdown` elsewhere per STACK.md — worth a spot-check that it isn't fed raw HTML from user input, though that's likely out of this phase's file set). **Flag this explicitly to the user as a known, accepted security tradeoff** rather than silently building around it — see Assumptions Log.

## Code Examples

### Regression test: single-flight refresh dedup (SESSION-02) — pattern to add to `api-client.test.ts`

```typescript
// Source: pattern derived from existing src/shared/api/api-client.test.ts conventions
// (vi.stubGlobal('fetch', ...) mocking, already used in this file — no MSW needed
// for this deterministic concurrency assertion; MSW's network-like scheduling is
// harder to pin down for exact call-count assertions than a directly controlled mock).
function createDeferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return { promise, resolve };
}

it('дедуплицирует параллельные refresh-запросы (single-flight)', async () => {
    const { useAuthStore } = await import('@/shared/lib/auth');
    useAuthStore.setState({
        accessToken: 'expired-access',
        refreshToken: 'refresh-1',
        isAuthenticated: true,
    });

    const refreshDeferred = createDeferred<{
        ok: boolean;
        status: number;
        json: () => Promise<unknown>;
        headers: Headers;
    }>();

    const fetchMock = vi
        .fn()
        // request A → 401
        .mockResolvedValueOnce({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            json: async () => ({}),
        })
        // request B → 401
        .mockResolvedValueOnce({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            json: async () => ({}),
        })
        // the single POST /auth/web/refresh call, held open until we resolve it
        .mockImplementationOnce(() => refreshDeferred.promise)
        // retried A
        .mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ a: 1 }),
        })
        // retried B
        .mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ b: 1 }),
        });

    vi.stubGlobal('fetch', fetchMock);

    const resultA = apiClient('/a', { auth: 'Bearer expired-access' });
    const resultB = apiClient('/b', { auth: 'Bearer expired-access' });

    refreshDeferred.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
    });

    await Promise.all([resultA, resultB]);

    const refreshCalls = fetchMock.mock.calls.filter(([url]) =>
        String(url).includes('/auth/web/refresh'),
    );
    expect(refreshCalls).toHaveLength(1); // SESSION-02: exactly one refresh call

    const { accessToken, refreshToken } = useAuthStore.getState();
    expect(accessToken).toBe('new-access'); // SESSION-03
    expect(refreshToken).toBe('new-refresh'); // SESSION-03
});
```

### Regression test: logout survives network failure (SESSION-05) — new file `use-logout.test.ts`

```typescript
// Source: pattern derived from existing test conventions (vi.mock next/navigation,
// vi.mock @/features/auth per .planning/codebase/TESTING.md)
vi.mock('@/features/auth/api/auth-api', () => ({
    webLogout: vi.fn().mockRejectedValue(new Error('network down')),
}));

it('очищает локальную сессию даже если /auth/web/logout упал по сети', async () => {
    useAuthStore.setState({ accessToken: 'a', refreshToken: 'r', isAuthenticated: true });
    const logout = useLogout();

    await logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
});
```

## State of the Art

| Old Approach                                                                         | Current Approach                                               | When Changed                                 | Impact                                                             |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| N/A — no prior JWT implementation existed in `.planning/` history for this milestone | Bearer-header + rotating-refresh-token pair, no session cookie | Already implemented pre-milestone (git `#6`) | The planner should treat SESSION-01/03/05 as "verify," not "build" |

**Deprecated/outdated:**

- `.planning/codebase/CONCERNS.md`'s "Authentication implementation incomplete (blocks web platform)" entry and the dev-token security note — both describe a state the codebase has moved past. Recommend `docs-reviewer`/`gsd-map-codebase` re-run flag this drift; not a blocker for this phase but the planner should not rely on that document's auth section.

## Assumptions Log

| #   | Claim                                                                                                                                                                                                                                                                                                                               | Section                         | Risk if Wrong                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | The `.planning/codebase/CONCERNS.md` "0% implemented" / dev-token characterization of web auth is stale, and the currently-committed `src/shared/api/api-client.ts` + `src/shared/lib/auth/auth-store.ts` + `src/shared/lib/platform/adapters/web-adapter.ts` + `src/views/auth/*` are the real, current implementation to build on | Summary                         | If wrong (e.g. this is dead/unreachable code, or a different branch is actually deployed), the planner would be hardening the wrong files entirely. Verified via direct `Read`/`grep`/`git log` on the working tree in this session — treat as high-confidence, but flag to the user once, since it materially changes phase scope from the roadmap's framing                                                            |
| A2  | SESSION-04's forced-navigation mechanism is an open design choice (event+router.push vs. `window.location.href`) not resolved by any existing decision in PROJECT.md/CONTEXT.md                                                                                                                                                     | Pitfall 2                       | If the planner picks one without flagging it, and the user actually cares about the full-reload-vs-SPA-nav tradeoff, this may need rework later. Low risk either way — both satisfy the literal SESSION-04 requirement                                                                                                                                                                                                   |
| A3  | `jwt-decode` is the correct/current package name for decode-only JWT parsing, should this phase or a later one opportunistically add a pre-flight expiry check                                                                                                                                                                      | Standard Stack, Don't Hand-Roll | Not required by SESSION-01..05 — only relevant if the planner chooses to also close `docs/backlog/401-auth-refresh-console-noise.md` in this phase. Package name sourced from training knowledge only, `npm view jwt-decode version` confirms registry existence (4.0.0) but that alone doesn't confirm legitimacy per the package-name provenance rule — gate any install behind `checkpoint:human-verify` if picked up |
| A4  | Storing refresh/access tokens in `localStorage` (vs. httpOnly cookie) is an accepted, already-locked architectural tradeoff for this project, not something this phase should change                                                                                                                                                | Pitfall 5                       | This is inferred from PROJECT.md's explicit NextAuth rejection + bare-token backend contract, not from an explicit "we accept the XSS tradeoff" statement. If the user actually wants mitigations beyond what's in scope (e.g. pushing for a backend Set-Cookie change), that's a cross-repo decision this phase alone can't make — surface it, don't silently proceed                                                   |

**If this table is empty:** N/A — see rows above.

## Open Questions (RESOLVED)

1. **RESOLVED — Forced-logout navigation mechanism (SESSION-04): event+router vs. hard redirect?**
    - What we know: Both satisfy the literal requirement ("cleared, redirected to sign in"). The rest of the app already uses `router.push` for auth-flow navigation.
    - What's unclear: Whether the user has a preference for SPA-smoothness vs. bulletproof-simplicity here, since a full-reload approach is trivially correct with zero wiring while the event-based approach needs a listener mounted early enough to never miss the event.
    - Recommendation: Default to Option A (event + `router.push` + `getSafeRedirect`) for consistency with existing navigation patterns; planner should note this as a reasonably reversible choice, not agonize over it.
    - **Resolution:** Option A adopted — `01-03-PLAN.md` dispatches `CustomEvent('auth:session-expired')` and implements `SessionExpiredListener` (`router.push` + `getSafeRedirect`, loop/private-path guards).

2. **RESOLVED — Should this phase also close the "401 console noise" backlog item via a pre-flight `exp` check?**
    - What we know: `docs/backlog/401-auth-refresh-console-noise.md` explicitly says "Bundle into NextAuth implementation (step 2)" — but that plan is dead (NextAuth rejected). SESSION-01..05 don't require it.
    - What's unclear: Whether "Phase 1: JWT Session Lifecycle" is the natural new home for this backlog item now that the NextAuth step it was deferred to no longer exists.
    - Recommendation: Treat as optional/stretch, not required for phase success criteria. If included, gate behind a 30s clock-skew buffer as the backlog doc already specifies, and use `jwt-decode` rather than hand-rolled parsing (see Don't Hand-Roll).
    - **Resolution:** Deferred — not picked up in this phase's plans (correctly excluded per recommendation). Remains open in `docs/backlog/401-auth-refresh-console-noise.md` for a future phase.

3. **RESOLVED — Audit completeness of direct `apiClient()` call sites bypassing `useApi()`**
    - What we know: 19 files use `useApi()` (which sources `auth` from `WebAdapter.getAuthHeader()` automatically); 3 files (`features/auth/api/auth-api.ts`, `features/push-notifications/api/push.api.ts`, `features/cart/lib/use-cart-backend-sync.ts`) call `apiClient()` directly with a manually-passed `auth` value.
    - What's unclear: Whether all 3 direct-call sites correctly and consistently source their `auth` value (e.g. from `useAuthStore` directly, matching what `WebAdapter.getAuthHeader()` would produce) — not fully audited in this research pass.
    - Recommendation: Planner should add a verification/audit task for SESSION-01 covering these 3 files specifically, since they're the ones most likely to silently drift from the Bearer-header contract if `auth-store.ts` is touched during this phase.
    - **Resolution:** Adopted — `01-01-PLAN.md` Task 2 audits all 3 direct-call sites for Bearer-header consistency.

## Environment Availability

| Dependency                           | Required By                               | Available                                                                                                                                        | Version | Fallback                                                 |
| ------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | -------------------------------------------------------- |
| Backend `/auth/web/refresh` endpoint | SESSION-02/03/04                          | Not directly probed this session (no running backend instance checked) — per PROJECT.md, "Backend endpoints already deployed, contract is fixed" | —       | None needed; treat as available per project decision log |
| Backend `/auth/web/logout` endpoint  | SESSION-05                                | Same as above                                                                                                                                    | —       | None needed                                              |
| Vitest 3.2.4 test runner             | Regression tests for all SESSION-\* items | ✓ [VERIFIED: package.json, vitest.config.ts present]                                                                                             | 3.2.4   | —                                                        |

**Missing dependencies with no fallback:** None identified.
**Missing dependencies with fallback:** None identified.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Vitest 3.2.4 [VERIFIED: package.json]                                                                                                             |
| Config file        | `vitest.config.ts` [VERIFIED: file read this session]                                                                                             |
| Quick run command  | `npm run test -- src/shared/api/api-client.test.ts src/shared/lib/platform/adapters/web-adapter.test.ts src/features/auth/lib/use-logout.test.ts` |
| Full suite command | `npm run test`                                                                                                                                    |

### Phase Requirements → Test Map

| Req ID     | Behavior                                                                     | Test Type     | Automated Command                                                                                                                                                                                                   | File Exists?                                            |
| ---------- | ---------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| SESSION-01 | Protected requests carry `Authorization: Bearer <accessToken>`               | unit          | `npm run test -- src/shared/lib/platform/adapters/web-adapter.test.ts` (needs new positive-case test)                                                                                                               | ❌ Wave 0 (positive case missing; negative case exists) |
| SESSION-02 | Concurrent 401s trigger exactly one `/auth/web/refresh` call (single-flight) | unit          | `npm run test -- src/shared/api/api-client.test.ts`                                                                                                                                                                 | ❌ Wave 0 (file exists, dedup test missing)             |
| SESSION-03 | Successful refresh replaces both accessToken and refreshToken                | unit          | `npm run test -- src/shared/api/api-client.test.ts`                                                                                                                                                                 | ❌ Wave 0 (file exists, this assertion missing)         |
| SESSION-04 | Refresh 401 → tokens cleared + user redirected to login                      | unit + manual | `npm run test -- src/shared/api/api-client.test.ts` (tokens-cleared assertion) + manual browser check (redirect behavior, since it involves `window.location`/router which is awkward to fully assert in happy-dom) | ❌ Wave 0 — both implementation and test missing        |
| SESSION-05 | Logout clears local session regardless of network result                     | unit          | `npm run test -- src/features/auth/lib/use-logout.test.ts`                                                                                                                                                          | ❌ Wave 0 — file doesn't exist at all                   |

### Sampling Rate

- **Per task commit:** `npm run test -- <changed test files>`
- **Per wave merge:** `npm run test` (full suite — pre-commit hook already runs `vitest run --changed` via Husky, but a full run before phase gate is still recommended)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/shared/api/api-client.test.ts` — add single-flight dedup test (SESSION-02), both-tokens-replaced test (SESSION-03), terminal-401→tokens-cleared test (part of SESSION-04)
- [ ] `src/shared/lib/platform/adapters/web-adapter.test.ts` — add positive case: `getAuthHeader()` returns `Bearer <token>` when `accessToken` is set (SESSION-01) — currently only the no-token negative case exists
- [ ] `src/features/auth/lib/use-logout.test.ts` — **does not exist**, create it; must cover both "webLogout succeeds" and "webLogout throws/network fails → local state still cleared" (SESSION-05)
- [ ] Implementation gap (not a test gap, but blocks the SESSION-04 test above): add the forced-navigation-on-terminal-refresh-failure logic itself to `tryRefreshTokens()` in `src/shared/api/api-client.ts` (see Pitfall 2)

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                                                                                                                                                                                                                                                                           |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| V2 Authentication     | Partial | Credential handling (password checks, etc.) is entirely backend responsibility, out of scope; frontend only carries opaque bearer tokens — no credential logic to review in this phase                                                                                                                                                     |
| V3 Session Management | Yes     | Rotating access+refresh token pair (SESSION-03 ✓ already implemented), single-flight refresh to avoid refresh-token race/reuse (SESSION-02, needs hardening + tests), explicit + failure-triggered session termination (SESSION-04/05)                                                                                                     |
| V4 Access Control     | Partial | `proxy.ts` middleware is a **UX convenience gate only** (presence-of-cookie check), not a security boundary — actual authorization is enforced server-side per-request via the `Authorization` header (backend responsibility, out of scope). Do not treat client-side route gating as sufficient access control when reviewing this phase |
| V5 Input Validation   | No      | This phase has no user-facing forms/inputs — pure token-management infrastructure                                                                                                                                                                                                                                                          |
| V6 Cryptography       | Partial | Client never verifies JWT signatures (correct — not its job); tokens are treated as opaque strings throughout. If a pre-flight `exp` check is added (Open Question 2), use a decode-only library, never hand-roll signature-adjacent parsing                                                                                               |

### Known Threat Patterns for this stack

| Pattern                                                                                                          | STRIDE                                           | Standard Mitigation                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| XSS-driven token theft from `localStorage` (accepted tradeoff — see Pitfall 5)                                   | Information Disclosure                           | CSP headers, avoid rendering unsanitized user content anywhere in the app (spot-check `react-markdown` usage), no `dangerouslySetInnerHTML` with user-controlled input                                                                                                                                                      |
| Refresh-token reuse/replay after rotation                                                                        | Repudiation / Elevation of Privilege             | Backend invalidates the old refresh token on every rotation (backend responsibility, already contracted per PROJECT.md); frontend must persist the _new_ refresh token immediately and atomically with the new access token (SESSION-03 requirement — already implemented via `setTokens(access, refresh)` called together) |
| Open redirect via `from`/`next` query param on forced-logout redirect                                            | Tampering                                        | Reuse `getSafeRedirect()` [VERIFIED: src/shared/lib/get-safe-redirect.ts] rather than building a new redirect-target sanitizer for SESSION-04                                                                                                                                                                               |
| CSRF via the mirrored `access_token` cookie                                                                      | Tampering                                        | Already mitigated — `setCookie()` sets `SameSite=Lax` [VERIFIED: src/shared/lib/auth/auth-store.ts]; low impact regardless since that cookie only feeds a redirect decision in `proxy.ts`, not an authenticated mutation                                                                                                    |
| Infinite/duplicated refresh calls on hard failure (TanStack Query `retry:1` stacking on `apiClient`'s own retry) | Denial of Service (self-inflicted, low severity) | Bounded by design (see Pitfall 4) — verify with a test rather than assuming, especially once SESSION-04's forced-navigation is added (should short-circuit the second attempt)                                                                                                                                              |

## Sources

### Primary (HIGH confidence)

- `src/shared/api/api-client.ts`, `src/shared/api/api-client.test.ts`, `src/shared/api/query-client.ts`, `src/shared/api/use-api.ts` — direct source read, this session
- `src/shared/lib/auth/auth-store.ts`, `src/shared/lib/auth/auth-store.test.ts`, `src/shared/lib/auth/map-user.ts` — direct source read, this session
- `src/shared/lib/platform/adapters/web-adapter.ts`, `src/shared/lib/platform/adapters/web-adapter.test.ts`, `src/shared/lib/platform/types.ts`, `src/shared/lib/platform/hooks/use-auth.ts` — direct source read, this session
- `src/features/auth/api/auth-api.ts`, `src/features/auth/lib/use-logout.ts`, `src/features/auth/index.ts` — direct source read, this session
- `src/proxy.ts` (Next.js 16 middleware) — direct source read, this session
- `src/views/auth/ui/login-page.tsx` and directory listing of `src/views/auth/` — direct source read, this session
- `src/shared/lib/get-safe-redirect.ts` — direct source read, this session
- `git log --oneline` on `web-adapter.ts`, `shared/lib/auth/`, `shared/api/api-client.ts`, `features/auth/` — confirms pre-existing implementation via PR #6 and related, this session
- `.planning/REQUIREMENTS.md`, `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/STATE.md` — this session
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STACK.md`, `.planning/codebase/TESTING.md` — this session (note: `.planning/codebase/CONCERNS.md`'s auth section is flagged stale, see State of the Art)

### Secondary (MEDIUM confidence)

- [Single-Flight Pattern — luminary.blog](https://luminary.blog/techs/04-single-flight-pattern/) — general single-flight/dedup pattern confirmation
- [SingleFlight: Smart Request Deduplication — DEV Community](https://dev.to/serifcolakel/singleflight-smart-request-deduplication-33og)
- [Best practice for handling auth token refresh in a frontend app — GitHub Discussions](https://github.com/orgs/community/discussions/184563)

### Tertiary (LOW confidence)

- OWASP JWT storage guidance, as summarized via web search aggregation rather than read directly from owasp.org this session — see: [LocalStorage vs Cookies — Cyber Chief](https://www.cyberchief.ai/2023/05/secure-jwt-token-storage.html), [The Developer's Guide to JWT Storage — Descope](https://www.descope.com/blog/post/developer-guide-jwt-storage), [Please Don't Use JSON Web Tokens for Browser Sessions](https://ianlondon.github.io/posts/dont-use-jwts-for-sessions/)
- `jwt-decode` package name/version — training knowledge + npm registry existence check only, not Context7/official docs (see Assumption A3)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new dependencies needed, existing stack directly verified by reading `package.json` and source files
- Architecture: HIGH — diagram and file map are drawn directly from reading the actual current implementation, not from generic JWT-refresh tutorials
- Pitfalls: HIGH for Pitfalls 1-4 (all traced through actual current code); MEDIUM for Pitfall 5 (security tradeoff framing draws on aggregated secondary sources, not a primary OWASP read)

**Research date:** 2026-07-03
**Valid until:** 2026-08-02 (30 days — stable domain, but re-verify against the working tree if significant auth-related commits land before planning executes, since this research is unusually dependent on exact current file contents)
