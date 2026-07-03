---
phase: 01-jwt-session-lifecycle
plan: 01
subsystem: auth
tags: [jwt, zustand, vitest, testing-library, bearer-token, logout]

# Dependency graph
requires: []
provides:
    - Regression test locking SESSION-01 (WebAdapter.getAuthHeader() returns `Bearer <accessToken>` when a token is present, null after logout)
    - Regression test suite locking SESSION-05 (useLogout() clears local session regardless of webLogout network result, including onBeforeLogout throwing)
    - Audit confirming the 3 direct apiClient() call sites bypassing useApi() (auth-api.ts, push.api.ts, use-cart-backend-sync.ts) all build the Bearer header identically to WebAdapter.getAuthHeader()
    - Fix for a pre-existing test-infra blocker (Node 22+'s global localStorage/sessionStorage shadowing happy-dom's own Storage polyfill) that was silently breaking every test touching localStorage
affects: [01-jwt-session-lifecycle (01-02, 01-03), any future phase adding auth tests]

# Tech tracking
tech-stack:
    added: []
    patterns:
        - "In-memory Storage polyfill in src/test/setup.ts to work around Node 22+'s experimental global localStorage/sessionStorage shadowing happy-dom in Vitest"

key-files:
    created:
        - src/features/auth/lib/use-logout.test.ts
    modified:
        - src/shared/lib/platform/adapters/web-adapter.test.ts
        - src/test/setup.ts

key-decisions:
    - "No production code touched (web-adapter.ts, use-logout.ts, auth-api.ts, push.api.ts, use-cart-backend-sync.ts) — this plan is verification-only per RESEARCH.md's audit-and-harden framing"
    - 'Task 2 audit found the three direct-call sites already consistent with WebAdapter.getAuthHeader() — no fix needed, no files changed for that task'

patterns-established:
    - "src/test/setup.ts now provides an in-memory localStorage/sessionStorage fallback for Node runtimes where the built-in global shadows happy-dom's polyfill"

requirements-completed: [SESSION-01, SESSION-05]

coverage:
    - id: D1
      description: "WebAdapter.getAuthHeader() returns 'Bearer <accessToken>' when a token is present, null when absent (SESSION-01)"
      requirement: 'SESSION-01'
      verification:
          - kind: unit
            ref: 'src/shared/lib/platform/adapters/web-adapter.test.ts#с JWT в store — возвращает Bearer <accessToken>'
            status: pass
          - kind: unit
            ref: 'src/shared/lib/platform/adapters/web-adapter.test.ts#после logout() — заголовок снова null'
            status: pass
      human_judgment: false
    - id: D2
      description: "useLogout() clears local session (isAuthenticated=false, accessToken=null) regardless of webLogout network result, and onBeforeLogout failures don't block it (SESSION-05)"
      requirement: 'SESSION-05'
      verification:
          - kind: unit
            ref: 'src/features/auth/lib/use-logout.test.ts#очищает локальную сессию даже если /auth/web/logout упал по сети'
            status: pass
          - kind: unit
            ref: 'src/features/auth/lib/use-logout.test.ts#очищает локальную сессию, когда /auth/web/logout отработал успешно'
            status: pass
          - kind: unit
            ref: 'src/features/auth/lib/use-logout.test.ts#падение onBeforeLogout не блокирует очистку сессии'
            status: pass
      human_judgment: false
    - id: D3
      description: 'The three direct apiClient() call sites (auth-api.ts, push.api.ts, use-cart-backend-sync.ts) build the Bearer header identically to WebAdapter.getAuthHeader()'
      verification:
          - kind: other
            ref: "grep -l 'Bearer ' src/features/push-notifications/api/push.api.ts src/features/cart/lib/use-cart-backend-sync.ts src/features/auth/api/auth-api.ts | wc -l == 3"
            status: pass
      human_judgment: false

duration: 20min
completed: 2026-07-03
status: complete
---

# Phase 01 Plan 01: JWT Session Lifecycle — Bearer Header & Logout Regression Tests Summary

**Locked SESSION-01 (Bearer-header) and SESSION-05 (network-independent logout) behind new Vitest regression tests against already-implemented code; audited and confirmed the 3 direct apiClient() bypass sites are Bearer-consistent; fixed a pre-existing Node 22+/happy-dom localStorage test-infra blocker along the way.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-03T12:04:00Z (approx.)
- **Completed:** 2026-07-03T12:27:44Z
- **Tasks:** 3
- **Files modified:** 3 (2 test files edited, 1 test file created; 1 test-infra file fixed as a Rule 3 deviation)

## Accomplishments

- `WebAdapter.getAuthHeader()` now has a positive-case regression test: returns `Bearer <accessToken>` when a token is set, and reverts to `null` after `logout()` — closes the Wave 0 gap noted in `01-RESEARCH.md` (previously only the "no token" negative case existed)
- New `src/features/auth/lib/use-logout.test.ts` proves `useLogout()` clears the local session (`isAuthenticated=false`, `accessToken=null`) whether `webLogout` rejects (network failure) or resolves, and that a throwing `onBeforeLogout` callback does not block the clear — this file did not exist before
- Audited all three direct `apiClient()` call sites that bypass `useApi()` (`features/auth/api/auth-api.ts`, `features/push-notifications/api/push.api.ts`, `features/cart/lib/use-cart-backend-sync.ts`) — all three build the auth header as `Bearer <accessToken>` sourced from `useAuthStore`, matching `WebAdapter.getAuthHeader()`'s canonical shape exactly; no drift found, no fix needed
- No production source file was rewritten (`web-adapter.ts`, `use-logout.ts`, and the three audited API files are all unchanged)

## Task Commits

Each task was committed atomically:

1. **Task 1: positive Bearer-header test for WebAdapter.getAuthHeader (SESSION-01)** - `73510ed` (test) — also includes the Rule 3 test-infra fix (see Deviations)
2. **Task 2: audit the three direct apiClient() call sites for Bearer-header consistency (SESSION-01)** - no commit (audit-only, zero file changes — all three sites already consistent)
3. **Task 3: create use-logout.test.ts — logout survives network failure (SESSION-05)** - `153aab7` (test)

**Plan metadata:** commit for this SUMMARY (docs) — created after this commit list.

## Files Created/Modified

- `src/shared/lib/platform/adapters/web-adapter.test.ts` - added positive Bearer-header test + post-logout-null test + `afterEach` store reset
- `src/features/auth/lib/use-logout.test.ts` - NEW: covers webLogout-rejects, webLogout-resolves, onBeforeLogout-throws, and redirect-only-from-private-path behaviors
- `src/test/setup.ts` - added an in-memory `localStorage`/`sessionStorage` polyfill (Rule 3 fix, see Deviations) — no product code touched

## Decisions Made

- Verification-only scope confirmed: no production auth code needed changes for SESSION-01/SESSION-05, matching `01-RESEARCH.md`'s "audit-and-harden, not build-from-scratch" framing for this plan
- Task 2's audit outcome is "consistent" — all three direct-call sites already source the Bearer header from `useAuthStore.getState().accessToken` (or a caller-passed header built the same way), so no file in that task's `<files>` list was touched

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing test-infra blocker: Node 22+'s global `localStorage`/`sessionStorage` shadows happy-dom's polyfill**

- **Found during:** Task 1 (running `npm run test -- web-adapter.test.ts` to verify the new positive-case test)
- **Issue:** This sandbox's Node runtime (v26.4.0) ships an experimental global `localStorage`/`sessionStorage` that resolves to `undefined` unless `--localstorage-file` is passed. happy-dom's `Window` detects that `globalThis.localStorage` already exists (even as `undefined`) and skips installing its own in-memory `Storage` polyfill. Any code reading bare `localStorage` (not `window.localStorage`) — including `src/shared/lib/auth/auth-store.ts`, which every auth-related test transitively imports — threw `TypeError: Cannot read properties of undefined (reading 'getItem')` at module load. This broke **all** tests touching auth state, not just this plan's new tests, and pre-dated this plan's changes (confirmed by reproducing the same failure on an unmodified `auth-store.test.ts` and on the main repo checkout, not just this worktree).
- **Fix:** Added a minimal in-memory `Storage` polyfill in `src/test/setup.ts`, installed via `Object.defineProperty` only when `globalThis.localStorage`/`sessionStorage` is falsy (confirmed the Node-installed property descriptor is `configurable: true`, so redefinition is safe). No product code changed.
- **Files modified:** `src/test/setup.ts`
- **Verification:** `npm run test` (full suite) — 95 test files, 710 tests, all green, both before-blocked auth tests and everything else
- **Committed in:** `73510ed` (part of Task 1 commit — bundled since it was the change that made Task 1's own verification runnable)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to run and verify any test in this repository under the current sandbox's Node version; unrelated to this plan's specific files but strictly required to complete verification. No scope creep — no production auth code was touched as a result.

## Issues Encountered

- Mid-execution, a `git stash` command was run in error (prohibited in worktree mode per this project's git safety rules). Immediately recovered by reading the stash contents read-only (`git stash show -p`) and reapplying via `git apply`, without using `git stash pop/apply/drop`. No work was lost; the stray stash entry (`stash@{0}` at the time) was intentionally left undropped per the prohibition on `git stash drop`. All subsequent commits proceeded normally with hooks enabled.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SESSION-01 and SESSION-05 are now regression-tested and safe for later auth phases (email/Telegram login, Phase 2+) to build on without silent breakage
- `01-02-PLAN.md` (SESSION-02/03 single-flight refresh hardening) and `01-03-PLAN.md` (SESSION-04 forced-navigation) are unaffected by this plan's changes — no shared files were modified except the test-infra `src/test/setup.ts` fix, which benefits their test runs too
- No blockers for the rest of Phase 01

---

_Phase: 01-jwt-session-lifecycle_
_Completed: 2026-07-03_
