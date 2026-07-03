---
phase: 01-jwt-session-lifecycle
plan: 03
subsystem: auth
tags: [jwt, session, react, nextjs, zustand, window-events]

# Dependency graph
requires:
    - phase: 01-jwt-session-lifecycle (plan 01-02)
      provides: hardened single-flight tryRefreshTokens() (static-import api-client.ts, single-flight refresh tests)
provides:
    - 'auth:session-expired window CustomEvent dispatched from all three tryRefreshTokens terminal-failure branches'
    - 'SessionExpiredListener client component that force-navigates to /login?from=<path> on the event, with loop guard and public-path guard'
affects: [phase-02-email-auth, phase-03-telegram-auth, phase-04-telegram-linking]

# Tech tracking
tech-stack:
    added: []
    patterns:
        - 'Plain-module-to-React bridge via window CustomEvent (api-client.ts stays framework-agnostic, listener owns navigation)'

key-files:
    created:
        - src/features/auth/ui/session-expired-listener/session-expired-listener.tsx
        - src/features/auth/ui/session-expired-listener/session-expired-listener.test.tsx
        - src/features/auth/ui/session-expired-listener/index.ts
    modified:
        - src/shared/api/api-client.ts
        - src/shared/api/api-client.test.ts
        - src/features/auth/index.ts
        - src/app/(web)/layout.tsx

key-decisions:
    - 'notifySessionExpired() is a module-local helper in api-client.ts (not exported) — keeps the event name as the only public contract between the plain module and the React tree'
    - 'Reused existing getSafeRedirect() for the from= param instead of writing a new redirect sanitizer'

patterns-established:
    - "Terminal auth-failure notification: dispatch window CustomEvent from non-React modules, consume via a mounted 'use client' listener component in the layout — mirrors CartSyncProvider's render-null provider pattern"

requirements-completed: [SESSION-04]

coverage:
    - id: D1
      description: "tryRefreshTokens() terminal-failure branches (no refreshToken, refresh 401, refresh network error) clear tokens AND dispatch window CustomEvent('auth:session-expired')"
      requirement: 'SESSION-04'
      verification:
          - kind: unit
            ref: 'src/shared/api/api-client.test.ts#терминальный 401 на refresh очищает токены и диспатчит auth:session-expired, повторный запрос не делает второй refresh'
            status: pass
          - kind: unit
            ref: 'src/shared/api/api-client.test.ts#сетевая ошибка при refresh (catch) тоже очищает токены и диспатчит auth:session-expired'
            status: pass
      human_judgment: false
    - id: D2
      description: 'SessionExpiredListener redirects to /login?from=<sanitized-path> on a private path when auth:session-expired fires, with loop guard (skip on /login) and public-path guard'
      requirement: 'SESSION-04'
      verification:
          - kind: unit
            ref: 'src/features/auth/ui/session-expired-listener/session-expired-listener.test.tsx#редиректит на /login?from=<path> при auth:session-expired на приватной странице'
            status: pass
          - kind: unit
            ref: 'src/features/auth/ui/session-expired-listener/session-expired-listener.test.tsx#не редиректит, если уже на /login (защита от цикла)'
            status: pass
          - kind: unit
            ref: 'src/features/auth/ui/session-expired-listener/session-expired-listener.test.tsx#не редиректит с публичной страницы'
            status: pass
      human_judgment: false
    - id: D3
      description: 'End-to-end: a user with an invalidated refresh token stays on a private page, triggers a protected request, and lands on /login without manual navigation'
      requirement: 'SESSION-04'
      verification: []
      human_judgment: true
      rationale: 'Requires an expired/invalidated real backend refresh token and observing browser navigation — not reproducible by unit-level mocks; deferred to /gsd-verify-work per VALIDATION.md MANUAL note'

# Metrics
duration: 4min
completed: 2026-07-03
status: complete
---

# Phase 01 Plan 03: Forced Navigation on Terminal Refresh Failure Summary

**`auth:session-expired` window event bridges the plain `api-client.ts` module to a mounted `SessionExpiredListener` that force-redirects to `/login?from=<path>` on private pages when a refresh token is terminally rejected.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-03T12:35:26Z
- **Completed:** 2026-07-03T12:39:45Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- `tryRefreshTokens()` now dispatches `window.dispatchEvent(new CustomEvent('auth:session-expired'))` immediately after `logout()` in all three terminal-failure branches (no `refreshToken`, refresh `!res.ok`, refresh network `catch`) — closing the SESSION-04 gap where tokens were cleared but the user was never navigated away from a now-broken authenticated page
- New `SessionExpiredListener` (`'use client'`, renders null, mirrors `CartSyncProvider`) mounted in `(web)/layout.tsx`: listens for the event, redirects to `/login?from=${encodeURIComponent(getSafeRedirect(pathname))}` only when `pathname` is one of `PRIVATE_PATHS`, with a loop guard (`pathname === '/login'` short-circuits) and public-path guard
- Pitfall 4 verified by test: once tokens are cleared, a follow-up `apiClient()` call short-circuits on the `if (!refreshToken)` branch and makes no second `/auth/web/refresh` network call
- `api-client.ts` remains a plain module — no `next/navigation` import (confirmed by grep + `tsc --noEmit`)
- Full test suite green: 96 test files, 718 tests passing; `npx tsc --noEmit` clean

## Task Commits

Each task was committed atomically:

1. **Task 1: dispatch auth:session-expired from tryRefreshTokens failure branches + tokens-cleared test (SESSION-04)** - `72a5c6d` (feat)
2. **Task 2: SessionExpiredListener component + test, wired into (web) layout (SESSION-04)** - `e5fdbe6` (feat)

_Note: this plan's `tdd="true"` RED phase (failing test) was verified manually via `npm run test` before implementation but could not be committed standalone — see Deviations._

## Files Created/Modified

- `src/shared/api/api-client.ts` - added module-local `notifySessionExpired()` helper, called after `logout()` in all three `tryRefreshTokens()` terminal-failure branches
- `src/shared/api/api-client.test.ts` - two new regression tests: terminal-401-on-refresh (tokens cleared + event dispatched + Pitfall 4 no-second-refresh), and refresh network-error/catch path
- `src/features/auth/ui/session-expired-listener/session-expired-listener.tsx` - new `'use client'` component: `useEffect` + `window.addEventListener('auth:session-expired', ...)`, `router.push()` on private-path match, cleanup on unmount
- `src/features/auth/ui/session-expired-listener/session-expired-listener.test.tsx` - new test: private-path redirect, `/login` loop guard, public-path guard, renders null, cleans up listener on unmount
- `src/features/auth/ui/session-expired-listener/index.ts` - slice-internal re-export
- `src/features/auth/index.ts` - added `export { SessionExpiredListener } from './ui/session-expired-listener'`
- `src/app/(web)/layout.tsx` - mounted `<SessionExpiredListener />` alongside `<CartSyncProvider />`

## Decisions Made

- `notifySessionExpired()` kept module-local (not exported) — the event name `auth:session-expired` is the only contract surface between `api-client.ts` and the React tree, matching RESEARCH.md's recommended Option A and its Anti-Patterns guidance (no `next/navigation` import into a plain module)
- Reused `getSafeRedirect()` for the `from` param rather than writing a new redirect sanitizer, per the threat model's T-1-02 mitigation plan

## Deviations from Plan

### Auto-fixed Issues

**1. [Process — TDD gate vs. project pre-commit hook] RED-phase test commit could not land standalone**

- **Found during:** Task 1 (after writing the failing regression test)
- **Issue:** This repo's Husky pre-commit hook (`.husky/pre-commit`, documented in CLAUDE.md) runs `npx vitest run --changed` and blocks any commit where tests fail. The GSD TDD flow calls for a separate `test(...)` RED commit before the `feat(...)` GREEN commit, but that RED commit is by definition a failing-test commit — the project's hard gate rejects it (confirmed: `git commit` exited 1 with "husky - pre-commit script failed", no commit landed).
- **Fix:** Verified the RED state manually (`npm run test -- src/shared/api/api-client.test.ts` showed 2 failing assertions with `expected [] to have a length of 1 but got +0`) before implementing GREEN, satisfying the fail-fast intent of the TDD gate without violating CLAUDE.md's mandatory pre-commit test gate. Test + implementation were then committed together in a single `feat(01-03):` commit once both passed. Same approach applied to Task 2's component (RED confirmed via import-resolution failure, then component + test committed together once green).
- **Files modified:** src/shared/api/api-client.test.ts, src/shared/api/api-client.ts (Task 1); session-expired-listener.tsx/test.tsx/index.ts, features/auth/index.ts, (web)/layout.tsx (Task 2)
- **Verification:** `npm run test` full suite green (718/718), `npx tsc --noEmit` clean
- **Committed in:** 72a5c6d (Task 1), e5fdbe6 (Task 2)

---

**Total deviations:** 1 auto-fixed (process/tooling — CLAUDE.md's pre-commit gate takes precedence over the GSD TDD commit-cadence default; no code-behavior deviation from the plan)
**Impact on plan:** None on scope or behavior. All `must_haves` truths, artifacts, and key_links from the plan frontmatter are satisfied exactly as specified.

## Issues Encountered

None beyond the TDD-commit-cadence note above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- SESSION-04 is the last open item in the "JWT session lifecycle hardening" active requirement in PROJECT.md — Phase 01's automated scope is now complete (SESSION-01/02/03/04/05 all covered by regression tests)
- MANUAL verification remains open per `01-VALIDATION.md`: log in, invalidate the refresh token server-side (or wait past its lifetime), stay on a private page, trigger a protected request, confirm landing on `/login` without manual navigation. Tracked as coverage `D3` (`human_judgment: true`) — to be executed at `/gsd-verify-work`.
- No blockers for Phase 02 (email auth) — this plan did not touch registration/login/verify-email flows, only the terminal-refresh-failure path.

---

_Phase: 01-jwt-session-lifecycle_
_Completed: 2026-07-03_
