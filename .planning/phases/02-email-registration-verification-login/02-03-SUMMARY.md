---
phase: 02-email-registration-verification-login
plan: 03
subsystem: auth
tags: [react, testing-library, vitest, zustand, verify-email, profile]

# Dependency graph
requires:
    - phase: 02-email-registration-verification-login
      provides: verify-email-page (VERIFY-01 flow), resendVerification export in features/auth, profile-page shell
provides:
    - "VERIFY-02: locked copy 'Почта подтверждена' on successful email verification"
    - 'VERIFY-03: resend-verification entry point in personal cabinet with pending/success/error states'
    - 'REG-04 regression test: cabinet renders with no email-verification gate (TUser has no such field)'
affects: [03-telegram-auth]

# Tech tracking
tech-stack:
    added: []
    patterns:
        - 'In-place action row in profile-page.tsx (button + local isSending/resendResult state) as a variant of the existing Link-based navigation rows'

key-files:
    created:
        - src/views/profile/ui/profile-page.test.tsx
    modified:
        - src/views/auth/ui/verify-email-page.tsx
        - src/views/auth/ui/verify-email-page.test.tsx
        - src/views/profile/ui/profile-page.tsx

key-decisions:
    - 'Copy-fix and its test assertion updated in the same commit (Task 1) to avoid a false-negative CI regression window'
    - "resendVerification is called with accessToken via useAuthStore selector — no gating on any email-verification status field, matching REG-04's intentional no-gate design"
    - "New resend row uses <button> + no trailing PencilSquareIcon, unlike the existing <Link> rows, because it's an in-place action, not navigation"

patterns-established:
    - 'Fire-and-forget action row pattern for profile-page.tsx: local isSending/resendResult state, disabled button during in-flight request, inline success message — reusable for future one-shot account actions'

requirements-completed: [REG-04, VERIFY-01, VERIFY-02, VERIFY-03]

coverage:
    - id: D1
      description: 'verify-email при успехе показывает заголовок «Почта подтверждена» (VERIFY-02 copy-fix)'
      requirement: 'VERIFY-02'
      verification:
          - kind: unit
            ref: 'src/views/auth/ui/verify-email-page.test.tsx#показывает успех при валидном токене'
            status: pass
      human_judgment: false
    - id: D2
      description: 'VERIFY-01 regression (verifyEmail called on mount, error/emailChanged paths) remains green after copy-fix'
      requirement: 'VERIFY-01'
      verification:
          - kind: unit
            ref: 'src/views/auth/ui/verify-email-page.test.tsx (8 tests total)'
            status: pass
      human_judgment: false
    - id: D3
      description: 'Личный кабинет: кнопка «Отправить письмо повторно» вызывает resendVerification(accessToken), disabled во время запроса, показывает «Письмо отправлено» при успехе, ничего не показывает при ошибке'
      requirement: 'VERIFY-03'
      verification:
          - kind: unit
            ref: 'src/views/profile/ui/profile-page.test.tsx#VERIFY-03: клик по «Отправить письмо повторно» вызывает resendVerification и показывает успех'
            status: pass
          - kind: unit
            ref: 'src/views/profile/ui/profile-page.test.tsx#VERIFY-03: кнопка disabled во время запроса, повторный клик не шлёт второй запрос'
            status: pass
          - kind: unit
            ref: 'src/views/profile/ui/profile-page.test.tsx#VERIFY-03: при ошибке не показывает «Письмо отправлено»'
            status: pass
      human_judgment: false
    - id: D4
      description: 'REG-04: ProfilePage рендерится для пользователя без поля email-верификации — доступ к кабинету не блокируется статусом почты'
      requirement: 'REG-04'
      verification:
          - kind: unit
            ref: 'src/views/profile/ui/profile-page.test.tsx#REG-04: рендерит кабинет для пользователя без поля email-верификации'
            status: pass
      human_judgment: false

# Metrics
duration: 8min
completed: 2026-07-03
status: complete
---

# Phase 2 Plan 3: Email Verification UI Summary

**Locked copy fix on verify-email success screen plus a new resend-verification row in the personal cabinet, with a regression test proving the cabinet never gates on email-verification status.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-07-03T21:31:00+03:00 (approx, first test run)
- **Completed:** 2026-07-03T21:34:01+03:00
- **Tasks:** 2
- **Files modified:** 4 (1 new, 3 edited)

## Accomplishments

- VERIFY-02: `STATUS_CONFIG.verified.title` changed from copy-drifted `'Email подтверждён'` to the locked UI-SPEC string `'Почта подтверждена'`, test updated in the same commit
- VERIFY-03: new "Подтвердить почту" row added to `profile-page.tsx` — calls `resendVerification(accessToken)` from `@/features/auth`, disables the button during the in-flight request (prevents double-fire), shows "Письмо отправлено" on success, no success text on error
- REG-04: `profile-page.test.tsx` created (file did not previously exist) with a regression test proving the cabinet renders (shows "Личный кабинет" + user name) for a user object that has no email-verification field at all — confirming the intentional absence of a verification gate
- VERIFY-01 regression (verifyEmail called on mount, `emailChanged` branch, error handling) untouched and still green (8/8 tests passing)

## Task Commits

Each task was committed atomically:

1. **Task 1: VERIFY-02 copy-fix + test** - `4472cca` (fix)
2. **Task 2 (TDD RED): profile-page.test.tsx — REG-04 + VERIFY-03 cases** - `0a6daa0` (test)
3. **Task 2 (TDD GREEN): resend row implementation** - `3e3fe61` (feat)

_TDD gate sequence verified: `test(...)` commit (`0a6daa0`) precedes `feat(...)` commit (`3e3fe61`)._

## Files Created/Modified

- `src/views/auth/ui/verify-email-page.tsx` - `STATUS_CONFIG.verified.title` now `'Почта подтверждена'`
- `src/views/auth/ui/verify-email-page.test.tsx` - assertion updated to match new locked copy
- `src/views/profile/ui/profile-page.tsx` - new resend-verification row with `handleResend`, `isSending`, `resendResult` local state; `accessToken` selector added
- `src/views/profile/ui/profile-page.test.tsx` - new file: 4 tests (REG-04 render regression, VERIFY-03 success, VERIFY-03 pending/disabled/no-double-fire, VERIFY-03 error)

## Decisions Made

- Copy-fix and its test assertion landed in a single commit (per RESEARCH.md Pitfall 3) to avoid a false CI regression window between the two changes.
- No new column/field added to `TUser` for email-verification status — REG-04 explicitly requires the cabinet to remain ungated; the regression test asserts this by rendering with a user object that has no such field and confirming full render.
- Resend row reuses the existing `EnvelopeIcon` import and the same `p-4 bg-base-100 rounded-2xl border ...` shell as the other cabinet rows, but swaps `<Link>` for `<button>` and drops the trailing `PencilSquareIcon` since it's an in-place action, not navigation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- VERIFY-02/VERIFY-03/REG-04 closed; no known stubs or gaps in this slice.
- Phase 3 (Telegram auth) can build on the same `profile-page.tsx` shell if it needs to add a Telegram-link row later — pattern established here (in-place action row) is reusable.

---

_Phase: 02-email-registration-verification-login_
_Completed: 2026-07-03_
