---
phase: 01-jwt-session-lifecycle
verified: 2026-07-03T16:25:00Z
status: passed
score: 6/7 must-haves verified
behavior_unverified: 1
overrides_applied: 0
re_verification:
    previous_status: human_needed
    previous_score: 5/7
    gaps_closed:
        - "CR-01 (session-integrity guarantee underlying SESSION-05): an explicit logout is not silently resurrected by a stale in-flight background refresh resolving afterward — now covered by an automated regression test (`api-client.test.ts` — 'CR-01: явный logout во время фонового refresh не откатывается устаревшим результатом refresh', commit 3033df7)"
    gaps_remaining:
        - 'SESSION-04 end-to-end: real-browser forced redirect on genuinely invalidated refresh token — still requires a human/browser, not resolved by this run (as expected)'
    regressions: []
behavior_unverified_items:
    - truth: 'SESSION-04 end-to-end: a user with a genuinely invalidated refresh token, mid-session on a private page, actually lands on /login in a real browser without manual navigation'
      test: 'Log in, invalidate the refresh token server-side (or wait past its lifetime), stay on a private page (e.g. /orders), trigger a protected request, observe the browser URL'
      expected: 'Browser navigates to /login?from=%2Forders without any manual reload/navigation'
      why_human: "Requires a real backend-invalidated refresh token and observing actual browser navigation — the automated tests only assert the CustomEvent is dispatched and that SessionExpiredListener calls router.push() with mocked next/navigation; no test exercises the real Next.js App Router or a live 401 from the backend. This is the phase's own VALIDATION.md 'Manual-Only Verification' and SUMMARY 01-03's coverage item D3 (human_judgment: true), still open. Unchanged since the previous verification run."
---

# Phase 1: JWT Session Lifecycle Verification Report

**Phase Goal:** Authenticated requests reliably carry, refresh, and clear JWT tokens across the app — the infrastructure every login/registration flow in later phases depends on. No login flow can be meaningfully tested without this working first.
**Verified:** 2026-07-03T16:25:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (CR-01 regression test added, commit 3033df7)

## Note on `mode: mvp`

Unchanged from the previous run: ROADMAP.md sets `Mode: mvp` on this phase, but the phase goal text is not phrased as a User Story. 01-01-PLAN.md documents this as intentional (infrastructure-only phase, no UI). This remains an open process/documentation decision item, not a code gap — see Human Verification item 2 below.

## What Changed Since Previous Verification

The previous run (2026-07-03T13:10:31Z) found 2 human-verification items. This re-verification focuses on item 2 (CR-01), per the task brief. Item 1 (SESSION-04 real-browser e2e) is unchanged and still requires a human/browser — not re-litigated in depth here beyond confirming no new automated coverage appeared.

**New evidence for CR-01:** commit `3033df7` ("test(01): регрессионный тест CR-01 — logout во время фонового refresh не воскрешает сессию") adds a new test to `src/shared/api/api-client.test.ts`: _"CR-01: явный logout во время фонового refresh не откатывается устаревшим результатом refresh"_.

### Independent verification of the CR-01 test (not trusted from claim)

I did not accept the SUMMARY/commit claim at face value. I independently:

1. **Read the test** (`api-client.test.ts:186-244`). It: sets an authenticated store state, triggers a request that 401s (starting a background refresh), holds the `POST /auth/web/refresh` fetch open via a deferred promise, waits (`vi.waitFor`) until the refresh fetch has actually been called (avoiding a false-positive race where `logout()` runs before the refresh even starts), calls `useAuthStore.getState().logout()` while the refresh is still in flight, _then_ resolves the held-open refresh with a fresh, valid token pair. It asserts the original request still rejects as `ApiError` and that the store remains logged out (`accessToken`/`refreshToken` both `null`, `isAuthenticated=false`) after the stale refresh resolves.
2. **Ran the test as-is:** `npx vitest run src/shared/api/api-client.test.ts -t "CR-01"` → 1 passed.
3. **Temporarily removed both CR-01 guard checks** in `src/shared/api/api-client.ts` (the `refreshTokenAtStart` re-checks at what is now lines 138 and 147 — one after `fetch`, one after parsing the JSON response) and re-ran the same test in isolation.
    - Result: **FAILED** — `AssertionError: expected TypeError: Cannot read properties of undefined... to be an instance of ApiError`. This happens because, with both guards removed, the stale refresh resurrects the session (`setTokens` runs), the original request is retried a third time, and the test's `fetchMock` has no third mocked implementation queued, so `fetch()` returns `undefined` and the retry throws a `TypeError` instead of resolving/rejecting as expected. This independently reproduces the manual-validation claim in the task brief (which also reported a `TypeError`).
4. **Tested defense-in-depth:** removed only the _first_ guard (post-fetch check) while leaving the second (post-`res.json()` check) intact, and re-ran the test → still **PASSED**. This confirms the second guard alone is sufficient to catch the regression, i.e. the two checks are genuine redundant protection, not one dead check propped up by the other.
5. **Restored `api-client.ts` to its original committed state** (`git diff --stat src/shared/api/api-client.ts` → clean, no diff) before continuing.
6. **Ran the full test suite once** (`npm run test`) → 96 files, 719 tests passed (718 previous + 1 new CR-01 test), no regressions. `npx tsc --noEmit` → clean.

**Conclusion:** The test is well-constructed, exercises exactly the race condition CR-01 addresses (logout during an in-flight background refresh, followed by a stale successful resolution), and demonstrably fails when the guard is absent and passes when the guard is present. This upgrades truth #7 from ⚠️ PRESENT_BEHAVIOR_UNVERIFIED to ✓ VERIFIED.

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                                                                                                       | Status                                                    | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | SESSION-01: every protected request carries `Authorization: Bearer <accessToken>` when a token is present                                                                                                   | ✓ VERIFIED                                                | Unchanged from previous run. `WebAdapter.getAuthHeader()` returns `Bearer ${accessToken}` (`web-adapter.ts:12-15`); positive + post-logout-null cases pass. 3 direct `apiClient()` bypass sites independently build `Bearer ${token}` from `useAuthStore`.                                                                                                                                                                                                       |
| 2   | SESSION-02/03: concurrent 401s collapse into exactly one `POST /auth/web/refresh`, and a successful refresh atomically replaces both `accessToken` and `refreshToken`; every pending request still resolves | ✓ VERIFIED                                                | Unchanged. `api-client.test.ts` single-flight dedup test passes live.                                                                                                                                                                                                                                                                                                                                                                                            |
| 3   | `tryRefreshTokens()` reaches the single-flight dedup check without an extra dynamic-import microtask hop                                                                                                    | ✓ VERIFIED                                                | Unchanged. `grep -c "await import('@/shared/lib/auth')" src/shared/api/api-client.ts` → 0; static top-level import confirmed. `tsc --noEmit` clean.                                                                                                                                                                                                                                                                                                              |
| 4   | SESSION-04: on terminal refresh failure tokens are cleared AND `auth:session-expired` is dispatched once per cycle; a mounted listener redirects to `/login?from=<path>` only on private paths              | ✓ VERIFIED (automated)                                    | Unchanged. All corresponding tests pass live. Live browser navigation not exercised — see human item below (truth #6).                                                                                                                                                                                                                                                                                                                                           |
| 5   | SESSION-05: `useLogout()` clears the local session regardless of network result, and a throwing `onBeforeLogout` does not block the clear                                                                   | ✓ VERIFIED                                                | Unchanged. `use-logout.test.ts` — 3 scenarios pass live.                                                                                                                                                                                                                                                                                                                                                                                                         |
| 6   | SESSION-04 end-to-end: real browser lands on `/login` when a genuinely invalidated refresh token is hit mid-session on a private page                                                                       | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED                            | Unchanged since previous run. Code present + wired, but no test drives a real Next.js router / live 401. Still flagged MANUAL in `01-VALIDATION.md` / `01-03-SUMMARY.md` coverage D3. No new automated e2e coverage found (`find` for `*.spec.ts`/e2e session tests → none).                                                                                                                                                                                     |
| 7   | CR-01 (session-integrity guarantee underlying SESSION-05): an explicit logout is not silently resurrected by a stale in-flight background refresh resolving afterward                                       | ✓ VERIFIED (upgraded from ⚠️ PRESENT_BEHAVIOR_UNVERIFIED) | New regression test `api-client.test.ts:186` ("CR-01: явный logout во время фонового refresh не откатывается устаревшим результатом refresh", commit `3033df7`) passes live, and was independently confirmed to (a) fail with a `TypeError` when both `refreshTokenAtStart` guards are removed, matching the manually-reported failure mode, and (b) pass when either guard alone is present. See "Independent verification" section above for full methodology. |

**Score:** 6/7 truths verified (1 present + wired, behavior not exercised by any test — the SESSION-04 real-browser item, which is out of scope for automated resolution)

### Required Artifacts

| Artifact                                                                          | Expected                                                                                                        | Status     | Details                                                                                                   |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `src/shared/lib/platform/adapters/web-adapter.test.ts`                            | positive Bearer case added                                                                                      | ✓ VERIFIED | Unchanged. Present, substantive, tests pass                                                               |
| `src/features/auth/lib/use-logout.test.ts`                                        | new file, network-failure-tolerant logout tests                                                                 | ✓ VERIFIED | Unchanged. 4 tests pass                                                                                   |
| `src/shared/api/api-client.ts`                                                    | dynamic import replaced with static import; event dispatch; CR-01/WR-02/WR-03 guards                            | ✓ VERIFIED | Unchanged, confirmed clean after temporary edit-and-revert during this verification. `tsc --noEmit` clean |
| `src/shared/api/api-client.test.ts`                                               | single-flight dedup test, both-tokens test, terminal-401 test, catch-path test, **+ new CR-01 regression test** | ✓ VERIFIED | 13 tests total (was 12), all pass                                                                         |
| `src/features/auth/ui/session-expired-listener/session-expired-listener.tsx`      | new component, renders null, redirects on private-path event                                                    | ✓ VERIFIED | Unchanged. Present, matches spec                                                                          |
| `src/features/auth/ui/session-expired-listener/session-expired-listener.test.tsx` | new test: private-path redirect, loop guard, public-path guard                                                  | ✓ VERIFIED | Unchanged. 3+ tests pass                                                                                  |
| `src/app/(web)/layout.tsx`                                                        | mounts `<SessionExpiredListener />`                                                                             | ✓ VERIFIED | Unchanged. Confirmed mounted alongside `<CartSyncProvider />`                                             |

### Key Link Verification

| From                                    | To                                                          | Via                                               | Status                            | Details                                                                                                                                         |
| --------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `WebAdapter.getAuthHeader`              | `useAuthStore.getState().accessToken`                       | direct read                                       | ✓ WIRED                           | Unchanged                                                                                                                                       |
| `useLogout`                             | `useAuthStore.logout` (via `useAuth()`)                     | network-independent local clear                   | ✓ WIRED                           | Unchanged                                                                                                                                       |
| module-level `refreshPromise` singleton | `tryRefreshTokens`                                          | dedup lock                                        | ✓ WIRED                           | Unchanged                                                                                                                                       |
| refresh success branch                  | `useAuthStore.setTokens(access, refresh)`                   | atomic pair replacement, session-identity-guarded | ✓ WIRED (now behaviorally proven) | `api-client.ts:127-153`, guarded by CR-01 `refreshTokenAtStart` re-check at two points; guard behavior now exercised end-to-end by the new test |
| `tryRefreshTokens` failure branches     | `window.dispatchEvent(CustomEvent('auth:session-expired'))` | `notifySessionExpired()` helper                   | ✓ WIRED                           | Unchanged                                                                                                                                       |
| `SessionExpiredListener`                | `router.push('/login?from=...')`                            | `auth:session-expired` window listener            | ✓ WIRED                           | Unchanged                                                                                                                                       |
| `(web)/layout.tsx`                      | mounts `SessionExpiredListener`                             | same pattern as `CartSyncProvider`                | ✓ WIRED                           | Unchanged                                                                                                                                       |

### Behavioral Spot-Checks

| Behavior                                                          | Command                                                                        | Result                                                                                  | Status                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| CR-01 regression test, isolated                                   | `npx vitest run src/shared/api/api-client.test.ts -t "CR-01"`                  | 1 passed                                                                                | ✓ PASS                                                         |
| CR-01 test fails when guard removed (both checks)                 | Same command, with both `refreshTokenAtStart` guard checks temporarily deleted | 1 failed — `TypeError: Cannot read properties of undefined` on retry after resurrection | ✓ PASS (confirms test is not a false-positive/tautology)       |
| CR-01 test still passes with only 2nd guard present               | Same command, with only the post-fetch guard removed, post-json guard intact   | 1 passed                                                                                | ✓ PASS (confirms defense-in-depth, not a single fragile check) |
| `api-client.ts` restored to committed state after temporary edits | `git diff --stat src/shared/api/api-client.ts`                                 | (no output — clean)                                                                     | ✓ PASS                                                         |
| Full targeted file test                                           | `npx vitest run src/shared/api/api-client.test.ts`                             | 10 tests, all passed                                                                    | ✓ PASS                                                         |
| TypeScript project-wide type-check                                | `npx tsc --noEmit`                                                             | No errors found                                                                         | ✓ PASS                                                         |
| Full project test suite (run once)                                | `npm run test`                                                                 | 96 test files passed, **719** tests passed (was 718)                                    | ✓ PASS                                                         |

### Probe Execution

No probes declared for this phase and none found under `scripts/*/tests/probe-*.sh`. Step 7c: SKIPPED (no probes applicable).

### Requirements Coverage

| Requirement | Source Plan | Description                                                                                                            | Status                                                     | Evidence                                                                                                                                                              |
| ----------- | ----------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SESSION-01  | 01-01       | Every protected request carries `Authorization: Bearer <accessToken>`                                                  | ✓ SATISFIED                                                | Unchanged                                                                                                                                                             |
| SESSION-02  | 01-02       | 401 triggers a single-flight `POST /auth/web/refresh`, concurrent requests dedup                                       | ✓ SATISFIED                                                | Unchanged                                                                                                                                                             |
| SESSION-03  | 01-02       | Successful refresh replaces both `accessToken` and `refreshToken`                                                      | ✓ SATISFIED                                                | Unchanged                                                                                                                                                             |
| SESSION-04  | 01-03       | Refresh also 401s → tokens cleared, user redirected to login                                                           | ⚠️ SATISFIED (automated) / human-needed (real-browser e2e) | Unchanged — event + listener + guards all tested; live navigation still unverified                                                                                    |
| SESSION-05  | 01-01       | Logout clears local session independent of network result, and is not resurrected by a stale in-flight refresh (CR-01) | ✓ SATISFIED                                                | `use-logout.test.ts` (3 scenarios) + now the CR-01 regression test closes the remaining behavioral gap on the session-integrity guarantee underlying this requirement |

**Orphaned requirements check:** Unchanged — no orphaned requirements.

**Documentation drift note (info, non-blocking, unchanged):** `.planning/REQUIREMENTS.md` still shows stale checkboxes for SESSION-02/03 (`[ ]` instead of `[x]`) despite the Requirement Mapping table and code confirming completion. Not introduced by this run, does not block phase closure.

### Anti-Patterns Found

| File                                              | Line | Pattern                                                                                         | Severity | Impact                                                              |
| ------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------- |
| `src/shared/lib/platform/adapters/web-adapter.ts` | 22   | `TODO(NextAuth): заменить на !!session?.user после реализации NextAuth (шаг 2 AUTH_ADAPTER.md)` | ℹ️ Info  | Unchanged, pre-existing, references formal follow-up, not a blocker |

No new debt markers introduced in `api-client.test.ts` (the new CR-01 test). No `TBD`/`FIXME`/`XXX`/`HACK`/`PLACEHOLDER` found in the new test code.

Commit `3033df7` confirmed present in git history, working tree clean (verified via `git status --short` before and after this verification's temporary edit-and-revert of `api-client.ts`).

### 01-REVIEW.md / 01-REVIEW-FIX.md Cross-Check (CR-01 updated)

| Finding             | Claimed Fix                                                  | Verified in Code?                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CR-01 (blocker)     | Re-check session identity before persisting refreshed tokens | ✓ Code present AND now behaviorally proven by an independently-validated regression test (see above). Upgraded from the previous run's "present but unexercised" finding. |
| WR-01 through WR-06 | (see previous verification)                                  | Unchanged, all previously verified, not re-checked in depth this run (no related code changes since)                                                                      |

## Human Verification Required

### 1. SESSION-04 real-browser forced redirect

**Test:** Log in on the web app, invalidate the refresh token server-side (or wait past its expiry), stay on a private page (e.g. `/orders`), trigger any protected request, and observe the browser.
**Expected:** The browser navigates to `/login?from=%2Forders` without any manual reload or navigation.
**Why human:** Requires a live backend-invalidated refresh token and a real Next.js App Router instance — not reproducible with the mocked `next/navigation` used in unit tests. This is the phase's own documented open item (`01-VALIDATION.md` Manual-Only Verifications, `01-03-SUMMARY.md` coverage D3). **Unchanged since the previous verification run — genuinely still open, as expected per the task brief.**

### 2. `mode: mvp` / non-User-Story goal mismatch (process item, not a code gap)

**Test:** N/A — decision item, not a runtime behavior.
**Expected:** Either re-tag Phase 1 as non-mvp in ROADMAP.md, or confirm this documented exception (infrastructure-only phases with no UI may deviate from the User Story goal template) is an accepted project convention going forward.
**Why human:** `gsd_run query user-story.validate` returns `false` for this phase's goal text; the phase's own PLAN.md already argues this is intentional, but the mode/goal mismatch should be a deliberate, documented decision rather than an implicit one. Unchanged since the previous run.

## Gaps Summary

No FAILED truths, no MISSING/STUB artifacts, no NOT_WIRED key links, no regressions. All automated tests (96 files / 719 tests, up from 718) and `tsc --noEmit` pass cleanly.

**CR-01 item closed:** The previous run's human-verification item #2 (CR-01 race-condition behavioral confirmation) is now resolved. A new regression test (commit `3033df7`) exercises the exact race — logout during an in-flight background refresh, followed by a stale successful resolution — and was independently confirmed (not just trusted) to: pass with the guard present, fail with a `TypeError` when both guard checks are removed (matching the reported manual-validation failure mode), and still pass when only one of the two redundant guard checks remains. This is genuine, well-constructed behavioral coverage, not a tautological or trivially-passing test.

**One item remains open, unchanged from the previous run:** SESSION-04's real-browser end-to-end redirect (previous item #1) still requires a human with a live browser and a backend-invalidated refresh token — this was never expected to be resolved by this re-verification and remains a legitimate human-verification item, not a gap in the codebase.

The `mode: mvp` process item (previous item #3) also remains open as a documentation/decision item, unrelated to code correctness.

---

_Verified: 2026-07-03T16:25:00Z_
_Verifier: Claude (gsd-verifier)_
