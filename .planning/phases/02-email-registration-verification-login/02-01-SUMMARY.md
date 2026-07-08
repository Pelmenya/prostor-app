---
phase: 02-email-registration-verification-login
plan: 01
subsystem: auth
tags: [react, nextjs, owasp, ui, jwt, telegram]

# Dependency graph
requires:
    - phase: 01-jwt-session-lifecycle
      provides: WebAdapter token storage (accessToken/refreshToken), ApiError shape
provides:
    - Status-gated 401 error handling on /login (OWASP A07 account-enumeration closed)
    - TelegramIcon shared component (currentColor outline, size?/className? contract)
    - Disabled "Войти через Telegram" entry point visible on shared auth screen
affects: [03-telegram-login-registration]

# Tech tracking
tech-stack:
    added: []
    patterns:
        - 'Status-gated ApiError handling: fixed user-facing string instead of extractErrorMessage(err.data) for security-sensitive 401 responses (mirrors forgot-password-page.tsx pattern)'
        - 'TelegramIcon prop contract mirrors WaterDrop outline variant (size?: number; className?: string, sizeProps width/height)'

key-files:
    created:
        - src/shared/ui/icons/telegram-icon.tsx
    modified:
        - src/views/auth/ui/login-page.tsx
        - src/views/auth/ui/login-page.test.tsx
        - src/shared/ui/icons/index.ts
        - src/shared/ui/index.ts

key-decisions:
    - "Merged Task 1 (RED tests) and Task 2 (GREEN fix) into a single commit — this repo's pre-commit hook runs `vitest run --changed` and blocks any commit that leaves failing tests, making a standalone RED-only commit impossible without --no-verify (forbidden). RED state was still verified via a standalone test run before implementing the fix, preserving the TDD verification loop without violating the hook."
    - 'Fixed test-isolation bug in login-page.test.tsx: useFormDraft persists the email draft to sessionStorage (not localStorage), so tests bled state into each other via user.type() appending onto a pre-filled value. Added sessionStorage.clear() to beforeEach (same class of fix as WR-06 in api-client.test.ts, which cleared localStorage for a different persistence layer).'

requirements-completed: [LOGIN-01, LOGIN-02]

coverage:
    - id: D1
      description: "401 login error always renders the fixed string «Неверная почта или пароль», never the backend's raw message (OWASP A07 account-enumeration closed)"
      requirement: 'LOGIN-02'
      verification:
          - kind: unit
            ref: 'src/views/auth/ui/login-page.test.tsx#LOGIN-02: подавляет backend-сообщение 401 и показывает locked-строку'
            status: pass
          - kind: unit
            ref: 'src/views/auth/ui/login-page.test.tsx#LOGIN-02: показывает locked-строку и без поля message в data (defense-in-depth)'
            status: pass
      human_judgment: false
    - id: D2
      description: 'Valid-credentials login still stores tokens and redirects (LOGIN-01 regression preserved)'
      requirement: 'LOGIN-01'
      verification:
          - kind: unit
            ref: 'src/views/auth/ui/login-page.test.tsx#вызывает webLogin при валидных данных'
            status: pass
          - kind: unit
            ref: 'src/views/auth/ui/login-page.test.tsx#редиректит после успешного логина'
            status: pass
      human_judgment: false
    - id: D3
      description: 'Disabled «Войти через Telegram» button with TelegramIcon and divider visible under the login form, no handler/route wired'
      verification:
          - kind: other
            ref: 'npx tsc --noEmit (types) + manual code inspection of login-page.tsx render output'
            status: pass
      human_judgment: true
      rationale: 'Visual placement/styling of the disabled button and divider is a UI-fit judgment call best confirmed by a human via Playwright screenshot of /login, not asserted by the unit test suite.'

# Metrics
duration: 55min
completed: 2026-07-04
status: complete
---

# Phase 2 Plan 01: Login Hardening + Telegram Entry Point Summary

**Status-gated 401 handling closes the login account-enumeration vector (OWASP A07) and adds a disabled "Войти через Telegram" entry point with a new TelegramIcon component to the shared auth screen.**

## Performance

- **Duration:** 55 min
- **Started:** 2026-07-04T10:22:00+03:00 (approx, retry of session-limit-interrupted attempt)
- **Completed:** 2026-07-04T10:37:00+03:00
- **Tasks:** 3 (2 planned commits due to pre-commit hook constraint — see Deviations)
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments

- LOGIN-02: `catch(ApiError)` in `login-page.tsx` now renders a fixed «Неверная почта или пароль» string for any 401, regardless of backend response body — closes an account-enumeration vector (was leaking messages like "User not found").
- LOGIN-01 regression preserved: valid-credentials login still stores tokens and redirects.
- New `TelegramIcon` shared component (`src/shared/ui/icons/telegram-icon.tsx`), exported through both `icons/index.ts` and `shared/ui/index.ts` barrels.
- `/login` now shows a divider ("или") + disabled "Войти через Telegram" button with `TelegramIcon` and a tooltip explaining it's inactive — visual groundwork for Phase 3's Telegram OIDC login.

## Task Commits

Each task was committed atomically (Task 1 and Task 2 combined into one commit — see Deviations):

1. **Task 1 + Task 2: LOGIN-02 tests + status-gated fix** - `c1e8da1` (fix)
2. **Task 3: TelegramIcon + disabled Telegram button** - `3ce828a` (feat)

_Note: TelegramIcon's SVG file and barrel exports were the only remaining artifacts in the Task 3 commit — the login-page.tsx wiring for the divider/button had already landed in the Task 1+2 commit because both tasks' edits to that file were made before the first commit succeeded (see Deviations)._

## Files Created/Modified

- `src/shared/ui/icons/telegram-icon.tsx` - New TelegramIcon component, monochrome outline (currentColor), `{ size?: number; className?: string }` prop contract mirroring `WaterDrop`'s outline variant
- `src/shared/ui/icons/index.ts` - Added `TelegramIcon` export
- `src/shared/ui/index.ts` - Added `TelegramIcon` to the icons destructure re-export
- `src/views/auth/ui/login-page.tsx` - Status-gated 401 handling (removed `extractErrorMessage` import/usage); added divider + disabled Telegram-login button with `TelegramIcon`
- `src/views/auth/ui/login-page.test.tsx` - Two new LOGIN-02 test cases (with/without `message` in `data`); added `sessionStorage.clear()` to `beforeEach` (test-isolation fix, see Deviations)

## Decisions Made

- Combined the RED and GREEN TDD steps for Task 1/2 into a single commit rather than two, because this repo's `.husky/pre-commit` hook runs `npx vitest run --changed` unconditionally and blocks any commit containing failing tests. A standalone RED commit is therefore structurally impossible here without skipping hooks (forbidden by both CLAUDE.md and the executor's git-safety rules). The RED state was still independently verified (`npm run test -- login-page.test.tsx` run and confirmed 2 failures before implementing the fix) to preserve the TDD verification discipline the plan calls for.
- Used a fixed inline string (`'Неверная почта или пароль'`) instead of `extractErrorMessage`, mirroring the `forgot-password-page.tsx` OWASP A07 pattern referenced in the plan.
- TelegramIcon uses a "paper airplane" glyph path with `currentColor` stroke only — explicitly avoiding the Telegram brand-blue `#26A5E4`, per UI-SPEC Color rule and CLAUDE.md's stated ban on any `WaterDrop`/brand-icon duplication (different icon family, but same "one canonical component, no ad-hoc variants" principle was applied).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pre-commit hook blocks TDD RED-only commits — merged Task 1+2 into one commit**

- **Found during:** Task 1 (attempting to commit failing LOGIN-02 tests per TDD RED step)
- **Issue:** `.husky/pre-commit` runs `npx lint-staged && npx steiger ./src && npx tsc --noEmit && npx vitest run --changed`. The last step fails (and blocks the commit) whenever any test in a changed file fails — which is exactly the state Task 1 requires (2 new failing LOGIN-02 tests, by design, before Task 2's fix exists). `git commit --no-verify` is forbidden by both CLAUDE.md and the executor's git-safety protocol.
- **Fix:** Verified RED state via a standalone `npm run test -- login-page.test.tsx` run (confirmed 2 new tests failing, 7 existing passing) before writing any implementation code. Then implemented Task 2's fix in the same working-tree state and committed Task 1's tests + Task 2's fix together as `c1e8da1`, once all 9 tests passed the hook's `vitest run --changed` check.
- **Files modified:** `src/views/auth/ui/login-page.test.tsx`, `src/views/auth/ui/login-page.tsx`
- **Verification:** `npm run test -- login-page.test.tsx` — 9/9 pass; RED state was confirmed separately beforehand and is documented in this SUMMARY.
- **Committed in:** `c1e8da1`

**2. [Rule 1 - Bug] Test-isolation bug: `useFormDraft` persists to `sessionStorage`, not `localStorage` — added `sessionStorage.clear()`**

- **Found during:** Task 1 (writing the second LOGIN-02 test case)
- **Issue:** The second new LOGIN-02 test intermittently failed with `webLogin` never being called (0 calls recorded). Root cause: `useFormDraft` (`src/shared/lib/hooks/use-form-draft.ts`) debounces the email field into `sessionStorage` under key `login-form-draft` on every keystroke (excluding password). Because `login-page.test.tsx` had no storage cleanup between tests, the previous test's typed email leaked into the next test's initial `defaultValues.email` via `getFormDraft`, and the next test's `user.type(emailInput, 'test@mail.ru')` appended onto the already-populated field (producing `test@mail.rutest@mail.ru`), which fails Zod email validation and silently prevents form submission — no `webLogin` call, no error, no redirect, and the assertion for the locked-string times out. This is the same category of test-isolation bug fixed for `localStorage` in `api-client.test.ts` under WR-06 (see recent commit `b77c6ce`), just against a different storage backend that this test file didn't yet guard against.
- **Fix:** Added `sessionStorage.clear()` to the existing `beforeEach` alongside `vi.clearAllMocks()`.
- **Files modified:** `src/views/auth/ui/login-page.test.tsx`
- **Verification:** Full suite run repeatedly and in isolation (`vitest run -t "LOGIN-02"`) confirms deterministic 9/9 pass after the fix; debug instrumentation (temporarily added, then removed before commit) confirmed the exact failure mode (`webLogin.mock.calls.length === 0`, email field value `test@mail.rutest@mail.ru`) before the fix and clean state after.
- **Committed in:** `c1e8da1`

---

**Total deviations:** 2 auto-fixed (1 blocking/process adaptation, 1 test-isolation bug fix)
**Impact on plan:** No scope creep — both deviations were necessary to satisfy the plan's own acceptance criteria (RED-then-GREEN verification, all tests green) within this repo's hook constraints. The task-commit granularity is slightly coarser than the plan's 1:1 task-to-commit mapping (Task 1+2 landed in one commit; Task 3's login-page.tsx portion also landed early in that same commit because both tasks' edits were made sequentially before the first commit attempt succeeded), but every task's `<done>` criterion is independently verifiable in the final diff and test run.

## Issues Encountered

- First `git commit` attempt for the test-only RED state failed at the `vitest run --changed` pre-commit gate (exit code 1) with 2 failing tests, as expected/designed for TDD RED — resolved by combining with Task 2 (see Deviations #1).
- Second test case (`defense-in-depth`, no `message` in `data`) failed non-deterministically depending on test run order/isolation — root-caused to sessionStorage leakage between tests (see Deviations #2), not a defect in the production code path being tested.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The shared `/login` auth screen now has a visible (disabled) Telegram entry point ready for Phase 3 to wire up real OIDC behavior — no handler/route exists yet by design (threat T-02-02 accepted risk, disposition: accept).
- `TelegramIcon` is available via `@/shared/ui` for reuse in Phase 3's Telegram login/registration flows.
- No blockers for Plan 02-02 or 02-03 (parallel wave siblings) — this plan only touched `login-page.tsx`/`login-page.test.tsx` and new/barrel files under `shared/ui/icons/`.

---

_Phase: 02-email-registration-verification-login_
_Completed: 2026-07-04_
