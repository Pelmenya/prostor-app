---
phase: 1
slug: jwt-session-lifecycle
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-03
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest 3.2.4                                                                                                                                      |
| **Config file**        | `vitest.config.ts`                                                                                                                                |
| **Quick run command**  | `npm run test -- src/shared/api/api-client.test.ts src/shared/lib/platform/adapters/web-adapter.test.ts src/features/auth/lib/use-logout.test.ts` |
| **Full suite command** | `npm run test`                                                                                                                                    |
| **Estimated runtime**  | ~30s (quick) / project full suite                                                                                                                 |

---

## Sampling Rate

- **After every task commit:** Run the quick run command above (or the changed test file directly)
- **After every plan wave:** Run `npm run test` (full suite)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior                                 | Test Type     | Automated Command                                                          | File Exists                   | Status     |
| -------- | ---- | ---- | ----------- | ---------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------- | ----------------------------- | ---------- |
| 01-01-01 | 01   | 0    | SESSION-01  | —          | Bearer header present on protected requests     | unit          | `npm run test -- src/shared/lib/platform/adapters/web-adapter.test.ts`     | ❌ W0 (positive case missing) | ⬜ pending |
| 01-01-02 | 01   | 0    | SESSION-02  | T-1-01     | Concurrent 401s → exactly one refresh call      | unit          | `npm run test -- src/shared/api/api-client.test.ts`                        | ❌ W0 (dedup test missing)    | ⬜ pending |
| 01-01-03 | 01   | 0    | SESSION-03  | —          | Refresh success replaces both tokens            | unit          | `npm run test -- src/shared/api/api-client.test.ts`                        | ❌ W0 (assertion missing)     | ⬜ pending |
| 01-01-04 | 01   | 0/1  | SESSION-04  | T-1-02     | Refresh 401 clears tokens + navigates to /login | unit + manual | `npm run test -- src/shared/api/api-client.test.ts` + manual browser check | ❌ W0 (impl + test missing)   | ⬜ pending |
| 01-01-05 | 01   | 0    | SESSION-05  | —          | Logout clears session even if network fails     | unit          | `npm run test -- src/features/auth/lib/use-logout.test.ts`                 | ❌ W0 (file doesn't exist)    | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `src/shared/api/api-client.test.ts` — add single-flight dedup test (SESSION-02), both-tokens-replaced test (SESSION-03), terminal-401→tokens-cleared test (part of SESSION-04)
- [ ] `src/shared/lib/platform/adapters/web-adapter.test.ts` — add positive case: `getAuthHeader()` returns `Bearer <token>` when `accessToken` is set (SESSION-01)
- [ ] `src/features/auth/lib/use-logout.test.ts` — does not exist, create it (SESSION-05)

---

## Manual-Only Verifications

| Behavior                                                | Requirement | Why Manual                                                                         | Test Instructions                                                                                                                                                                      |
| ------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forced redirect to `/login` on terminal refresh failure | SESSION-04  | Involves `window.location`/router navigation, awkward to fully assert in happy-dom | Log in, invalidate refresh token server-side (or wait past its lifetime), stay on a private page, trigger any protected request, confirm landing on `/login` without manual navigation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
