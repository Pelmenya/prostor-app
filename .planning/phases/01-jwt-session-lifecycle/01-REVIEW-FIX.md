---
phase: 01-jwt-session-lifecycle
fixed_at: 2026-07-03T13:04:09Z
review_path: .planning/phases/01-jwt-session-lifecycle/01-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-07-03T13:04:09Z
**Source review:** .planning/phases/01-jwt-session-lifecycle/01-REVIEW.md
**Iteration:** 1

**Summary:**

- Findings in scope: 7 (CR-01 blocker + WR-01 through WR-06; IN-01/IN-02 out of scope per `fix_scope: critical_warning`)
- Fixed: 7
- Skipped: 0

## Fixed Issues

### CR-01: Background token refresh can resurrect a session after explicit logout

**Files modified:** `src/shared/api/api-client.ts`
**Commit:** 85bbff6
**Applied fix:** Captured `refreshTokenAtStart` at the beginning of the refresh IIFE and re-checked `useAuthStore.getState().refreshToken === refreshTokenAtStart` both immediately after the `fetch` resolves and immediately after parsing the response body, before calling `setTokens`. If the session has been logged out (or a newer refresh already completed) while this refresh was in flight, the stale result is silently discarded instead of resurrecting the session. Applied exactly as suggested in REVIEW.md, matching the current code state.

### WR-01: `auth:session-expired` can be dispatched repeatedly for sequential post-logout requests

**Files modified:** `src/shared/api/api-client.ts`, `src/shared/api/index.ts`, `src/views/auth/ui/login-page.tsx`, `src/views/auth/ui/register-page.tsx`, `src/shared/api/api-client.test.ts`
**Commit:** ed6b272
**Applied fix:** Added module-level `sessionExpiredNotified` guard flag in `api-client.ts` so `notifySessionExpired()` only dispatches the event once per expired-session cycle. Reset the flag on a successful token refresh. Went beyond the review's inline suggestion (which only sketched the guard) to also close the gap it flagged in its own note: exported a public `resetSessionExpiredNotified()` and called it after `setTokens()` in `login-page.tsx` and `register-page.tsx`, since those pages call the auth store directly (not through `tryRefreshTokens`) — without this, the flag would stay `true` forever after a single session expiry, permanently suppressing future expiry redirects for the rest of the SPA session. Also strengthened `api-client.test.ts`'s existing "терминальный 401" test to assert the dispatch count stays at 1 after the follow-up post-logout request, per the gap the review explicitly called out in that test.

### WR-02: No validation of the `/auth/web/refresh` response shape before persisting tokens

**Files modified:** `src/shared/api/api-client.ts`
**Commit:** cc61f4b
**Applied fix:** Added a type guard on the parsed refresh response — `typeof data?.accessToken !== 'string' || typeof data?.refreshToken !== 'string'` — before calling `setTokens`. On a malformed response, the session is terminated (`logout()` + `notifySessionExpired()`) instead of persisting `"undefined"` strings into `localStorage`. Applied as suggested.

### WR-03: `refreshPromise` reset is not exception-safe

**Files modified:** `src/shared/api/api-client.ts`
**Commit:** fbafafe
**Applied fix:** Wrapped `await refreshPromise;` / `refreshPromise = null;` in `try { ... } finally { ... }` so the module-level lock is always released even if the refresh IIFE's promise ever rejects. Applied as suggested.

### WR-04: `isPrivate` path-matching logic duplicated verbatim

**Files modified:** `src/shared/config/private-paths.ts`, `src/shared/config/index.ts`, `src/features/auth/lib/use-logout.ts`, `src/features/auth/ui/session-expired-listener/session-expired-listener.tsx`
**Commit:** a90845e
**Applied fix:** Extracted `isPrivatePath(pathname: string): boolean` into `src/shared/config/private-paths.ts` (co-located with the `PRIVATE_PATHS` constant it operates on, rather than the review's suggested standalone `src/shared/lib/is-private-path.ts` — same outcome, better cohesion, avoids an extra file), exported it from the slice's public API (`shared/config/index.ts`), and replaced both duplicated inline implementations in `use-logout.ts` and `session-expired-listener.tsx` with imports. Note: a third, pre-existing duplicate of this same logic exists in `src/proxy.ts` (Next.js middleware, edge runtime) — left untouched since it was not part of this finding's `files_reviewed` scope or the reviewer's File: field; flagging for a future pass.

### WR-05: `src/test/setup.ts` storage-polyfill guard doesn't cover the "throws" case its own comment describes

**Files modified:** `src/test/setup.ts`, `vitest.config.ts`
**Commit:** ecf09ba
**Applied fix:** Wrapped the `globalThis[key]` access in `try/catch` before the truthiness check, so a synchronous throw on some Node 22.x releases falls back to `existing = undefined` instead of crashing the whole test run before the polyfill installs. Also added cross-referencing comments between `setup.ts` and `vitest.config.ts` per the review's secondary note, documenting that both mechanisms guard the same root cause. Verified with a full `vitest run` (718/718 passing).

### WR-06: `api-client.test.ts`'s `afterEach` doesn't clear `localStorage` between tests in the same file

**Files modified:** `src/shared/api/api-client.test.ts`
**Commit:** b77c6ce
**Applied fix:** Added `localStorage.clear()` to the file's `afterEach`, alongside the existing `useAuthStore.setState(initialAuthState, true)` reset, closing the test-isolation gap where the single-flight test's real `setTokens()` call leaves stale tokens in the polyfilled `localStorage` for the rest of the file.

## Skipped Issues

None — all in-scope findings (CR-01, WR-01–WR-06) were fixed. IN-01 and IN-02 were excluded per `fix_scope: critical_warning` and not attempted.

## Verification

- `npx tsc --noEmit` (project-wide): no errors in any modified file.
- `npx vitest run` (full suite): 718/718 tests passing, 96/96 test files passing.
- Each fix committed atomically; husky pre-commit (lint-staged + steiger + tsc + `vitest run --changed`) passed for every commit.

---

_Fixed: 2026-07-03T13:04:09Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
