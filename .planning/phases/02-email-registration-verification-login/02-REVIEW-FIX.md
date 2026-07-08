---
phase: 02-email-registration-verification-login
fixed_at: 2026-07-04T08:03:09Z
review_path: .planning/phases/02-email-registration-verification-login/02-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-07-04T08:03:09Z
**Source review:** .planning/phases/02-email-registration-verification-login/02-REVIEW.md
**Iteration:** 1

**Summary:**

- Findings in scope: 4 (CR-01, WR-01, WR-02, WR-03 — `fix_scope: critical_warning`)
- Fixed: 4
- Skipped: 0 (IN-01 out of scope for this run, not attempted)

## Fixed Issues

### CR-01: Unguarded sessionStorage access in a globally-mounted component can crash the entire app

**Files modified:** `src/features/auth/ui/registration-notice-listener/registration-notice-listener.tsx`
**Commit:** `e619ad3`
**Applied fix:** Extracted a `readFlag()` helper that wraps `sessionStorage.getItem` in
try/catch (returns `false` on throw), and wrapped the `sessionStorage.removeItem` call inside
`dismiss()` in try/catch as well — mirroring the existing `getFormDraft`/`useFormDraft` idiom
(WR-05) already used elsewhere in the codebase. Verified: `tsc --noEmit` clean on the file, all
3 existing component tests still pass, full test suite (731 tests) green.

### WR-01: LOGIN-02 error handling collapses all ApiError statuses, not just 401

**Files modified:** `src/views/auth/ui/login-page.tsx`, `src/views/auth/ui/login-page.test.tsx`
**Commit:** `522d811`
**Applied fix:** Split the `catch` branch so only `err.status === 401` renders the generic
"Неверная почта или пароль" locked string (required by LOGIN-02/OWASP A07); any other `ApiError`
(429, 500, etc.) now renders "Не удалось войти. Попробуйте позже." instead. Added a new test
(`WR-01: не показывает locked-строку для не-401 ApiError`) exercising a mocked 429 response,
closing the test gap the review called out. Verified: 10/10 tests pass (was 9), `tsc --noEmit`
clean on the file.

### WR-02: ProfilePage has no redirect/guard for unauthenticated users

**Files modified:** `src/views/profile/ui/profile-page.tsx`, `src/views/profile/ui/profile-page.test.tsx`
**Commit:** `c7ffce6`
**Applied fix:** Added `useRouter` + a `useEffect` guard that calls
`router.replace('/login?from=%2Fprofile')` when `mounted && !user`, mirroring the existing
`router.push('/login?from=/profile/...')` pattern used by
`change-password-page.tsx`/`change-email-page.tsx`/`personal-info-page.tsx`. Added a
`next/navigation` mock and a new test (`WR-02: редиректит неавторизованного пользователя на
/login и ничего не рендерит`) asserting the redirect fires and no cabinet content leaks.
Verified: 5/5 tests pass (was 4), `tsc --noEmit` clean on the file.

**Note:** This introduces new navigation logic (an effect-driven redirect) rather than fixing an
existing conditional, so it is a low-risk addition rather than a logic-correction — both tiers of
automated verification passed and the added test directly exercises the new behavior. No further
human verification flag was deemed necessary, but reviewers may still want to manually confirm
the `/login?from=%2Fprofile` deep-link round-trip in a browser.

### WR-03: `reg-notice-pending` sessionStorage key duplicated as an untyped string literal, unverified by tests

**Files modified:** `src/features/auth/lib/registration-notice.ts` (new),
`src/features/auth/index.ts`, `src/views/auth/ui/register-page.tsx`,
`src/features/auth/ui/registration-notice-listener/registration-notice-listener.tsx`,
`src/views/auth/ui/register-page.test.tsx`,
`src/features/auth/ui/registration-notice-listener/registration-notice-listener.test.tsx`
**Commit:** `56f3946`
**Applied fix:** Introduced `REGISTRATION_NOTICE_FLAG_KEY` in a new
`features/auth/lib/registration-notice.ts` module, exported it from the `@/features/auth` public
API, and replaced both the raw `'reg-notice-pending'` literal in `register-page.tsx` and the
local `FLAG_KEY` literal in `registration-notice-listener.tsx`/its test with imports of the shared
constant. Updated `register-page.test.tsx`'s `@/features/auth` mock to use `importOriginal` (so
the constant stays real instead of `undefined` under the mock) and added an assertion that
`sessionStorage.getItem(REGISTRATION_NOTICE_FLAG_KEY)` is `'1'` after a successful registration
submit — closing the test gap the review identified. Verified: Steiger (FSD linter) clean, `tsc
--noEmit` clean, all 10 tests across both affected test files pass, full suite (731 tests) green.

## Skipped Issues

None — all in-scope findings (CR-01, WR-01, WR-02, WR-03) were fixed. IN-01 was excluded by
`fix_scope: critical_warning` and not attempted in this run.

---

_Fixed: 2026-07-04T08:03:09Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
