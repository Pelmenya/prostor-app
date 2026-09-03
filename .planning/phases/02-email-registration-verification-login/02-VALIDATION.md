---
phase: 02
slug: email-registration-verification-login
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-03
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest 3.2.4                                                                                                                                                                                               |
| **Config file**        | `vitest.config.ts`                                                                                                                                                                                         |
| **Quick run command**  | `npm run test -- src/views/auth/ui/register-page.test.tsx src/views/auth/ui/login-page.test.tsx src/views/auth/ui/verify-email-page.test.tsx src/views/profile/ui/profile-page.test.tsx src/features/auth` |
| **Full suite command** | `npm run test`                                                                                                                                                                                             |
| **Estimated runtime**  | ~30 seconds                                                                                                                                                                                                |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- <changed test files>`
- **After every plan wave:** Run `npm run test` (full suite)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement                 | Threat Ref | Secure Behavior                                                              | Test Type | Automated Command                                                                            | File Exists                                    | Status     |
| -------- | ---- | ---- | --------------------------- | ---------- | ---------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------- |
| 02-01-01 | 01   | 1    | REG-02                      | —          | N/A                                                                          | unit      | `npm run test -- src/views/auth/ui/register-page.test.tsx`                                   | ❌ Wave 0                                      | ⬜ pending |
| 02-01-02 | 01   | 1    | LOGIN-02                    | T-02-01    | Backend 401 detail never surfaced verbatim; generic locked copy always shown | unit      | `npm run test -- src/views/auth/ui/login-page.test.tsx`                                      | ❌ Wave 0                                      | ⬜ pending |
| 02-01-03 | 01   | 1    | VERIFY-02                   | —          | N/A                                                                          | unit      | `npm run test -- src/views/auth/ui/verify-email-page.test.tsx`                               | ❌ Wave 0 (existing assertion pins wrong copy) | ⬜ pending |
| 02-02-01 | 02   | 1/2  | REG-03                      | —          | N/A                                                                          | unit      | `npm run test -- src/features/auth` (registration-notice-listener.test.tsx)                  | ❌ Wave 0                                      | ⬜ pending |
| 02-02-02 | 02   | 1/2  | REG-04                      | —          | No component/route gates on email-verification state                         | unit      | Regression test asserting `profile-page.tsx` renders without an `emailVerified`-shaped field | ❌ Wave 0                                      | ⬜ pending |
| 02-03-01 | 03   | 1/2  | VERIFY-03                   | —          | N/A                                                                          | unit      | `npm run test -- src/views/profile/ui/profile-page.test.tsx`                                 | ❌ Wave 0 (file may not exist yet)             | ⬜ pending |
| 02-04-01 | 04   | 2    | — (UI-SPEC Telegram button) | —          | Disabled button, no OIDC network call this phase                             | unit      | `npm run test -- src/views/auth/ui/login-page.test.tsx`                                      | ❌ Wave 0                                      | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_
_Note: exact Task IDs above are illustrative — the planner assigns final plan/wave/task numbering; this table's Requirement/Command/File-Exists columns are the binding contract._

---

## Wave 0 Requirements

- [ ] `src/views/auth/ui/register-page.test.tsx` — add happy-path test: `webRegister` called with mapped payload, `setTokens`/`setUser` called, `router.push` called with the redirect target (REG-02)
- [ ] `src/views/auth/ui/login-page.test.tsx` — add: 401 with `ApiError.data.message` set to an arbitrary backend string still renders the locked generic `'Неверная почта или пароль'` copy (LOGIN-02); update any assertion currently pinning `'Неверный email или пароль'`
- [ ] `src/views/auth/ui/verify-email-page.test.tsx:82` — update assertion from `'Email подтверждён'` to `'Почта подтверждена'` in the same change that fixes `STATUS_CONFIG.verified.title` (VERIFY-02)
- [ ] `src/features/auth/ui/registration-notice-listener/registration-notice-listener.test.tsx` — new file; must cover mount-with-flag-set → banner visible, dismiss → flag cleared + banner hidden, mount-without-flag → nothing rendered (REG-03)
- [ ] `src/views/profile/ui/profile-page.test.tsx` — verify existence at plan time (not found by research session's file search — likely doesn't exist yet); if missing, create it; must cover the new resend row: click → `resendVerification` called, pending-disables-button, success/error states (VERIFY-03)
- [ ] `src/shared/ui/icons/telegram-icon.test.tsx` or equivalent — light smoke test only if the project's icon-component convention includes tests (verify by checking whether `water-drop.tsx` has a sibling test file at plan time)

---

## Manual-Only Verifications

_None — all phase behaviors have automated verification. (The exact `POST /auth/web/login` 401 response body contract from the backend could not be independently verified this session — RESEARCH.md Open Question 2 — but the frontend fix is implemented defensively regardless of the exact backend shape, so it doesn't require a manual-only check.)_

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
