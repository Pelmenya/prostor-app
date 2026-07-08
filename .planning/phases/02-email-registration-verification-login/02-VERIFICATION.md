---
phase: 02-email-registration-verification-login
verified: 2026-07-04T11:15:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
    - test: 'Открыть /login в браузере (Playwright), визуально проверить divider «или» + disabled-кнопку «Войти через Telegram» с иконкой и title-tooltip под формой входа'
      expected: 'Кнопка визуально согласована с остальной карточкой формы (spacing, alignment), иконка не обрезана, title-tooltip показывается при наведении на disabled-кнопку'
      why_human: 'Пиксель-точное визуальное соответствие/расположение — код подтверждён (markup, disabled, title, className присутствуют), но эстетическое качество компоновки требует человеческого глаза; сам исполнитель пометил этот пункт как human_judgment:true в 02-01-SUMMARY.md (D3)'

    - test: 'В браузере: зарегистрироваться → убедиться, что баннер «Мы отправили письмо для подтверждения почты» виден на странице, куда привёл редирект → закрыть (×) → перейти на другую страницу → баннер не появляется снова'
      expected: 'Баннер виден один раз сразу после регистрации на любой странице-цели редиректа; после закрытия не возвращается ни на текущей, ни на последующих страницах'
      why_human: 'Юнит-тесты покрывают компонент изолированно (флаг выставлен → виден; dismiss → скрыт+флаг очищен; без флага → null) — сама логика верифицирована поведенчески. Но полный кросс-навигационный проход через реальный Next.js роутер (редирект после регистрации → монтаж layout на новой странице → dismiss → навигация ещё раз) не запускался в этом окружении; 02-02-SUMMARY.md прямо рекомендует прогнать этот сценарий в браузере перед финальной приёмкой фазы.'
---

# Phase 2: Email Registration, Verification & Login Verification Report

**Phase Goal:** As a new or returning user, I want to register by email, verify my email, and log in by email or password, so that I land in my authenticated personal cabinet through a shared auth screen that Phase 3 will extend with Telegram login.
**Verified:** 2026-07-04T11:15:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| #   | Truth                                                                                                                                                       | Status     | Evidence                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | User can fill out the registration form (имя, фамилия, email, телефон, пароль ≥8, 2 чекбокса) and submit, creating an account via `POST /auth/web/register` | ✓ VERIFIED | `src/views/auth/ui/register-page.tsx` — Zod schema with all fields + two `refine`-gated consent checkboxes; `webRegister` called with `first_name/last_name/email/phone/password/policyVersion/pdAgreementVersion`. `register-page.test.tsx` (7 tests, all pass) covers field validation, checkbox validation, and happy path.                                                                        |
| 2   | After successful registration, user is immediately authenticated (tokens stored), redirected, and sees "Мы отправили письмо..." notice                      | ✓ VERIFIED | `register-page.tsx` calls `setTokens`/`setUser`/`resetSessionExpiredNotified`/`sessionStorage.setItem(REGISTRATION_NOTICE_FLAG_KEY,'1')`/`router.push` in that order (lines 161-166). `RegistrationNoticeListener` (layout-mounted) reads the flag and shows dismissible `alert-info` banner. 3 listener unit tests + 1 register-page happy-path test all pass (10 total across both files).          |
| 3   | Clicking `/verify-email?token=...` shows "Почта подтверждена"; unverified user keeps full app access, no block                                              | ✓ VERIFIED | `verify-email-page.tsx` `STATUS_CONFIG.verified.title === 'Почта подтверждена'` (fixed from copy-drift 'Email подтверждён'); `verify-email-page.test.tsx` asserts this string (8 tests pass). REG-04: `profile-page.tsx` has no email-verification field/gate anywhere; `profile-page.test.tsx` regression test renders full cabinet for a user object lacking any such field.                        |
| 4   | Authenticated user can request the verification email again (`POST /auth/resend-verification`) without hitting a wall                                       | ✓ VERIFIED | `profile-page.tsx` new "Подтвердить почту" row calls `resendVerification(accessToken)`; button `disabled={isSending}` prevents double-fire; success/error local state. `profile-page.test.tsx` 3 dedicated VERIFY-03 tests (success, pending/no-double-fire, error) all pass.                                                                                                                         |
| 5   | User can log in with existing email/password; wrong email or password shows one generic "Неверная почта или пароль" that never reveals which part was wrong | ✓ VERIFIED | `login-page.tsx` catch-branch: `err.status === 401` → fixed locked string; other `ApiError` statuses (429/500) → distinct "Не удалось войти..." message (post-review-fix WR-01, prevents mis-reporting non-credential errors as wrong-password); network errors → "Ошибка сети". 10 tests in `login-page.test.tsx` cover LOGIN-01 regression, both LOGIN-02 401 variants, and the WR-01 non-401 case. |

**Score:** 5/5 truths verified (0 present-but-behavior-unverified)

### Required Artifacts

| Artifact                                                                             | Expected                                                      | Status     | Details                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/views/auth/ui/login-page.tsx`                                                   | Status-gated 401 handling + disabled Telegram entry           | ✓ VERIFIED | Reviewed in full; `err.status === 401` gate present; Telegram button `disabled` + `title` present; `TelegramIcon` imported from `@/shared/ui`                                                                        |
| `src/shared/ui/icons/telegram-icon.tsx`                                              | New icon, `currentColor`-only, `{size?, className?}` contract | ✓ VERIFIED | Matches `WaterDrop` outline contract; no brand-blue hardcoded; exported via both barrels (`icons/index.ts`, `shared/ui/index.ts`)                                                                                    |
| `src/features/auth/ui/registration-notice-listener/registration-notice-listener.tsx` | Layout-mounted one-shot banner                                | ✓ VERIFIED | `useIsClient`-gated SSR-safe render; `readFlag()`/`dismiss()` wrapped in try/catch (CR-01 fix present); uses shared `REGISTRATION_NOTICE_FLAG_KEY` constant (WR-03 fix present)                                      |
| `src/views/auth/ui/register-page.tsx`                                                | Sets notice flag before redirect                              | ✓ VERIFIED | `sessionStorage.setItem(REGISTRATION_NOTICE_FLAG_KEY, '1')` present, imported from `@/features/auth` (shared constant, not raw literal)                                                                              |
| `src/app/(web)/layout.tsx`                                                           | Mounts `RegistrationNoticeListener`                           | ✓ VERIFIED | Mounted directly after `<SessionExpiredListener />`                                                                                                                                                                  |
| `src/views/auth/ui/verify-email-page.tsx`                                            | Locked copy "Почта подтверждена"                              | ✓ VERIFIED | `STATUS_CONFIG.verified.title === 'Почта подтверждена'`                                                                                                                                                              |
| `src/views/profile/ui/profile-page.tsx`                                              | Resend row + no verification gate + auth guard                | ✓ VERIFIED | Resend row wired to `resendVerification`; no email-verification field gate anywhere (REG-04); WR-02 fix present — `useEffect` redirects unauthenticated visitors to `/login?from=%2Fprofile` before returning `null` |
| `src/features/auth/lib/registration-notice.ts`                                       | Shared flag-key constant (WR-03 fix)                          | ✓ VERIFIED | New file, exported through `@/features/auth` public API, imported by both writer and reader                                                                                                                          |

### Key Link Verification

| From                                        | To                                | Via                                                                  | Status  | Details                                                                                                                                                                               |
| ------------------------------------------- | --------------------------------- | -------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `login-page.tsx` onSubmit catch             | Fixed locked string               | `err.status === 401` gate, no `extractErrorMessage`                  | ✓ WIRED | `extractErrorMessage` import removed from `login-page.tsx`; confirmed via `grep` (not present)                                                                                        |
| `TelegramIcon`                              | `@/shared/ui` public API          | icons barrel → shared/ui barrel                                      | ✓ WIRED | Both barrel files updated; `login-page.tsx` imports it from `@/shared/ui`                                                                                                             |
| `register-page.tsx`                         | `RegistrationNoticeListener`      | `REGISTRATION_NOTICE_FLAG_KEY` sessionStorage flag                   | ✓ WIRED | Same shared constant imported in both files (post-WR-03 fix); `register-page.test.tsx` asserts `sessionStorage.getItem(REGISTRATION_NOTICE_FLAG_KEY) === '1'` after successful submit |
| `verify-email STATUS_CONFIG.verified.title` | Rendered `<h1>`                   | Direct object lookup by `status`                                     | ✓ WIRED | Confirmed rendered via `{STATUS_CONFIG[status].title}`                                                                                                                                |
| `profile-page.tsx` resend button            | `resendVerification(accessToken)` | `onClick={handleResend}` → `useAuthStore` selector for `accessToken` | ✓ WIRED | Confirmed in code; unit-tested with mocked `resendVerification`                                                                                                                       |
| `profile-page.tsx` guard                    | `/login?from=%2Fprofile`          | `useEffect` + `router.replace`                                       | ✓ WIRED | WR-02 fix confirmed present in code and covered by dedicated test                                                                                                                     |

### Behavioral Spot-Checks

| Behavior                         | Command                                                                                                                                                                                                                                    | Result                                                                                                                                                                        | Status |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| All phase-2 unit tests pass      | `npm run test -- src/views/auth/ui/login-page.test.tsx src/views/auth/ui/register-page.test.tsx src/views/auth/ui/verify-email-page.test.tsx src/views/profile/ui/profile-page.test.tsx src/features/auth/ui/registration-notice-listener` | 5 files, 33/33 tests passed                                                                                                                                                   | ✓ PASS |
| TypeScript compiles project-wide | `npx tsc --noEmit`                                                                                                                                                                                                                         | No errors found                                                                                                                                                               | ✓ PASS |
| FSD structure lint               | `npx steiger ./src`                                                                                                                                                                                                                        | No problems found                                                                                                                                                             | ✓ PASS |
| Claimed commits exist in history | `git log --oneline --all \| grep <hashes>`                                                                                                                                                                                                 | All 10 commits referenced across 3 SUMMARYs + REVIEW-FIX (`c1e8da1`, `3ce828a`, `c35eb2f`, `4472cca`, `0a6daa0`, `3e3fe61`, `e619ad3`, `522d811`, `c7ffce6`, `56f3946`) found | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description                                           | Status      | Evidence                                                                                          |
| ----------- | ----------- | ----------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| REG-01      | 02-02       | Регистрация по email/паролю с 2 чекбоксами            | ✓ SATISFIED | `register-page.tsx` form + `register-page.test.tsx` (7 tests)                                     |
| REG-02      | 02-02       | Токены сохранены, редирект после регистрации          | ✓ SATISFIED | happy-path test asserts `webRegister` payload, `setTokens`/`setUser`, `router.push`               |
| REG-03      | 02-02       | Уведомление о письме подтверждения                    | ✓ SATISFIED | `RegistrationNoticeListener` + 3 unit tests                                                       |
| REG-04      | 02-03       | Неподтверждённая почта не блокирует доступ            | ✓ SATISFIED | No verification field in `TUser`/`ProfilePage`; regression test                                   |
| VERIFY-01   | 02-03       | `/verify-email?token=...` → `POST /auth/verify-email` | ✓ SATISFIED | Pre-existing, regression-tested (8 tests in `verify-email-page.test.tsx`)                         |
| VERIFY-02   | 02-03       | "Почта подтверждена" copy                             | ✓ SATISFIED | `STATUS_CONFIG.verified.title` fixed + test updated same commit                                   |
| VERIFY-03   | 02-03       | Повторная отправка письма                             | ✓ SATISFIED | `profile-page.tsx` resend row + 3 tests                                                           |
| LOGIN-01    | 02-01       | Вход по email/паролю                                  | ✓ SATISFIED | Pre-existing, regression-tested                                                                   |
| LOGIN-02    | 02-01       | Общее сообщение об ошибке 401                         | ✓ SATISFIED | Status-gated fix + WR-01 refinement (non-401 `ApiError` no longer misreported); 4 dedicated tests |

**No orphaned requirements.** All 9 requirement IDs declared in ROADMAP Phase 2 (`REG-01, REG-02, REG-03, REG-04, VERIFY-01, VERIFY-02, VERIFY-03, LOGIN-01, LOGIN-02`) appear in exactly one plan's `requirements:` frontmatter (02-01: LOGIN-01/02; 02-02: REG-01/02/03; 02-03: REG-04, VERIFY-01/02/03) with no gaps and no duplicates.

### Anti-Patterns Found

None. Scanned all 8 modified/created files for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER`, empty-return stubs, and hardcoded-empty props — no matches beyond legitimate HTML `placeholder=` input attributes and a DaisyUI `avatar-placeholder` class name (both false positives, not code-debt markers).

### Code Review Findings — Cross-Checked Against Codebase

The phase went through one code-review cycle (`02-REVIEW.md`) which found 1 critical + 3 warning + 1 info issue, followed by a fix pass (`02-REVIEW-FIX.md`) claiming all 4 critical/warning findings fixed. Verified independently (not trusting the FIX report's claims):

| Finding                                                                 | Claimed Fix                                                                | Verified in Codebase                                                                                                  |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| CR-01: unguarded `sessionStorage` access in globally-mounted listener   | `try/catch` wrapping `readFlag()`/`dismiss()`                              | ✓ Confirmed present, `registration-notice-listener.tsx:14-20,44-51`                                                   |
| WR-01: LOGIN-02 collapses all `ApiError` statuses into locked string    | Status-gated to `=== 401` only                                             | ✓ Confirmed present, `login-page.tsx:42-50`; new test `WR-01: не показывает locked-строку для не-401 ApiError` passes |
| WR-02: `ProfilePage` has no auth guard/redirect                         | `useEffect` + `router.replace('/login?from=%2Fprofile')`                   | ✓ Confirmed present, `profile-page.tsx:19-21`; new test `WR-02: редиректит...` passes                                 |
| WR-03: `reg-notice-pending` key duplicated as untyped literal, untested | Shared `REGISTRATION_NOTICE_FLAG_KEY` constant + write-side test assertion | ✓ Confirmed present, `features/auth/lib/registration-notice.ts`; `register-page.test.tsx:190` asserts the flag is set |

IN-01 (Enter-key submit during doc-loading shows misleading error) was correctly left unfixed — explicitly out of `fix_scope: critical_warning` for this run, informational severity, does not block phase goal.

### Human Verification Required

1. **Telegram entry-point visual placement** — Open `/login`, confirm the divider + disabled "Войти через Telegram" button/icon/tooltip look correct and are properly spaced under the login form. Code-confirmed present and functionally inert (disabled, no handler); only aesthetic/pixel-level fit needs a human eye (the executor itself flagged this as `human_judgment: true` in 02-01-SUMMARY.md).
2. **REG-03 banner cross-navigation, real browser** — Register a new account, confirm the "Мы отправили письмо..." banner appears on whatever page the redirect lands on, dismiss it, navigate again, confirm it does not reappear. Unit tests verify the component's internal state transitions (flag→visible, dismiss→hidden+flag-cleared, no-flag→null) in isolation; the full Next.js-router cross-page round trip was not exercised in this environment (both 02-02-SUMMARY.md and this verification note the same gap; no dev server/browser available here).

### Gaps Summary

No blocking gaps found. All 5 ROADMAP success criteria are verified in the actual codebase (not just claimed by SUMMARY.md), all 9 requirement IDs are satisfied and none are orphaned, all 4 code-review findings (1 critical, 3 warning) were independently re-verified as genuinely fixed in the diff (not just claimed in 02-REVIEW-FIX.md), the full test suite for touched files passes (33/33), `tsc --noEmit` and `steiger` are clean, and all commits referenced across the three SUMMARYs and the REVIEW-FIX report exist in git history. The only open items are two human-eyes/browser confirmations (visual button placement, real cross-navigation banner persistence) — neither represents a code defect found during this verification, both were proactively flagged by the executor's own SUMMARYs as needing a follow-up browser pass.

---

_Verified: 2026-07-04T11:15:00Z_
_Verifier: Claude (gsd-verifier)_
