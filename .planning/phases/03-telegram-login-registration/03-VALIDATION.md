---
phase: 03
slug: telegram-login-registration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-06
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest 3.2.4                                                                                                                                                           |
| **Config file**        | `vitest.config.ts` (`environment: 'happy-dom'`, `globals: true`)                                                                                                       |
| **Quick run command**  | `npm run test -- src/views/auth/ui/login-page.test.tsx src/views/auth/ui/telegram-register-page.test.tsx src/features/auth src/views/profile/ui/profile-page.test.tsx` |
| **Full suite command** | `npm run test`                                                                                                                                                         |
| **Estimated runtime**  | ~30 seconds                                                                                                                                                            |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- <changed test files>`
- **After every plan wave:** Run `npm run test` (full suite)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds
- **Phase gate note:** Given the BotFather bot is not yet configured (see RESEARCH.md Open Question 3, RESOLVED), a live Playwright MCP end-to-end pass against a real Telegram popup cannot happen until the bot is set up. Unit tests must mock `window.Telegram.Login.auth` exhaustively; the manual smoke pass is tracked as `blocked_by: third-party` in UAT, not treated as a phase-level blocker (same pattern as SESSION-04 in Phase 1).

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior                                                                                  | Test Type | Automated Command                                                   | File Exists                        | Status     |
| -------- | ---- | ---- | ----------- | ---------- | ------------------------------------------------------------------------------------------------ | --------- | ------------------------------------------------------------------- | ---------------------------------- | ---------- |
| 03-01-01 | 01   | 1    | TG-01       | T-03-01    | `id_token` treated as opaque, never decoded/trusted client-side                                  | unit      | `npm run test -- src/views/auth/ui/login-page.test.tsx`             | ❌ Wave 0                          | ⬜ pending |
| 03-01-02 | 01   | 1    | TG-01       | —          | Popup-blocked/generic error returns to idle state, email form stays usable                       | unit      | `npm run test -- src/views/auth/ui/login-page.test.tsx`             | ❌ Wave 0                          | ⬜ pending |
| 03-02-01 | 02   | 1/2  | TG-02       | —          | N/A                                                                                              | unit      | `npm run test -- src/views/auth/ui/telegram-register-page.test.tsx` | ❌ Wave 0 (new file)               | ⬜ pending |
| 03-02-02 | 02   | 1/2  | TG-03       | —          | Expired/missing token fails closed to restart state, never renders form                          | unit      | `npm run test -- src/views/auth/ui/telegram-register-page.test.tsx` | ❌ Wave 0                          | ⬜ pending |
| 03-02-03 | 02   | 1/2  | TG-03       | —          | Ambiguous submit error clears sessionStorage and restarts flow                                   | unit      | `npm run test -- src/views/auth/ui/telegram-register-page.test.tsx` | ❌ Wave 0                          | ⬜ pending |
| 03-02-04 | 02   | 1/2  | TG-04       | —          | Email-conflict is intentionally disclosed (different tradeoff from LOGIN-02) — do not genericize | unit      | `npm run test -- src/views/auth/ui/telegram-register-page.test.tsx` | ❌ Wave 0                          | ⬜ pending |
| 03-03-01 | 03   | 1/2  | TG-04       | —          | N/A                                                                                              | unit      | `npm run test -- src/views/profile/ui/profile-page.test.tsx`        | ❌ Wave 0 (extend existing)        | ⬜ pending |
| 03-04-01 | —    | —    | TG-01..04   | —          | Real popup round trip against `oauth.telegram.org`                                               | manual    | Playwright MCP smoke pass                                           | N/A — blocked until bot configured | ⬜ blocked |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_
_Note: exact Task IDs above are illustrative — the planner assigns final plan/wave/task numbering; this table's Requirement/Command/File-Exists columns are the binding contract._

---

## Wave 0 Requirements

- [ ] `src/views/auth/ui/login-page.test.tsx` — add full Telegram button state-machine coverage (idle → nonce-loading → awaiting-popup → exchanging → success/error), mocking `window.Telegram = { Login: { auth: vi.fn(...) } }` (new mock shape — the existing Mini App SDK mock in `telegram-adapter.test.ts` is unrelated and not reusable)
- [ ] `src/views/auth/ui/telegram-register-page.test.tsx` — new file; must cover prefill-from-sessionStorage, missing/expired-token → restart state, submit success, submit → TG-03 branch, submit → TG-04 branch
- [ ] `src/features/auth/lib/telegram-registration.test.ts` — new file; cover set/read/clear + TTL expiry + storage-throws-synchronously fail-closed behavior (mirrors `use-form-draft.test.ts`'s storage-guard test style)
- [ ] `src/views/profile/ui/profile-page.test.tsx` — extend existing file with a test for the conditional "Привязать Telegram" row

---

## Manual-Only Verifications

| Behavior                                                                          | Requirement  | Why Manual                                                                                                                                                                                       | Test Instructions                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real Telegram Login popup round trip (nonce → widget → id_token → login/register) | TG-01, TG-02 | No automated test can substitute for a live popup against `oauth.telegram.org`; also currently blocked — BotFather bot not yet configured for "Web Login"/OIDC mode (client_id, redirect domain) | Once the bot is configured: open `/login` in a real browser, click "Войти через Telegram", complete the popup flow, confirm redirect to personal cabinet with valid tokens (existing account) and confirm redirect to `/telegram-register` with prefilled data (new account) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
