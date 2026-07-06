---
phase: 03-telegram-login-registration
plan: 01
subsystem: auth
tags: [telegram, oidc, jwt, sessionStorage, react-hook-form, zod, next-script]

# Dependency graph
requires:
    - phase: 01-jwt-session-lifecycle
      provides: setTokens/setUser/useAuthStore, resetSessionExpiredNotified, api-client 401-refresh
    - phase: 02-email-registration-verification-login
      provides: login-page.tsx shell with disabled Telegram button placeholder, auth-schemas.ts/auth-api.ts conventions, registration-notice.ts one-shot flag pattern
provides:
    - telegramNonce/telegramLogin/telegramRegister API functions (auth-api.ts)
    - useTelegramOidc reusable OIDC transport hook (nonce → popup → id_token)
    - telegram-registration.ts sessionStorage lifecycle (set/read/clear, 10-min TTL, fail-closed)
    - telegramRegisterSchema + TTelegramRegisterForm (auth-schemas.ts)
    - Fully wired 5-state Telegram login button on login-page.tsx (TG-01 complete)
    - TELEGRAM_LINK_HINT_FLAG_KEY constant (consumed by future Plan 03)
affects:
    [03-02-telegram-registration-completion, 03-03-telegram-link-hint, 04-telegram-account-linking]

# Tech tracking
tech-stack:
    added: []
    patterns:
        - 'OIDC popup transport as a reusable hook decoupled from caller (useTelegramOidc) — Phase 4 LINK-01 will consume unchanged'
        - 'sessionStorage lifecycle module with single-source-of-truth key constants + try/catch fail-closed on every touch (mirrors use-form-draft.ts)'
        - "Separate local busy/error state for the Telegram button, independent from the email form's isSubmitting — keeps the two login entry points decoupled"

key-files:
    created:
        - src/features/auth/lib/telegram-registration.ts
        - src/features/auth/lib/telegram-registration.test.ts
        - src/features/auth/lib/use-telegram-oidc.ts
    modified:
        - src/features/auth/api/auth-api.ts
        - src/features/auth/lib/auth-schemas.ts
        - src/features/auth/index.ts
        - src/views/auth/ui/login-page.tsx
        - src/views/auth/ui/login-page.test.tsx
        - src/shared/lib/platform/utils/detect-platform.ts

key-decisions:
    - "use-telegram-oidc.ts implemented WITHOUT useCallback — CLAUDE.md forbids useMemo/useCallback/React.memo (React Compiler handles memoization); RESEARCH's own Pattern 1 code example used useCallback, but CLAUDE.md takes precedence over plan/research illustrations"
    - "window.Telegram global type unified in detect-platform.ts (added optional Login alongside existing WebApp) instead of a second competing declare global in use-telegram-oidc.ts — TypeScript requires identical types when the same global interface member is declared in multiple files; this is a blocking-issue fix (Rule 3), not scope creep, since the Mini App SDK's WebApp declaration already existed"
    - "telegramRegisterSchema duplicates register-page.tsx's phoneE164Ru regex literal rather than hoisting it to a shared export — register-page.tsx is not in this plan's files_modified list, so hoisting would be an out-of-scope edit; documented with a comment so the two regexes don't silently drift"
    - "TTelegramProfile type lives in telegram-registration.ts (not duplicated in auth-api.ts) — auth-api.ts imports it for TTelegramLoginResponse's registrationRequired branch, single source of truth for the profile shape"
    - "Telegram error mapping: hook classifies into 'popup-blocked' | 'cancelled' | 'unknown' — a synchronous throw from window.Telegram.Login.auth() (the most common real popup-blocked signal) maps to 'popup-blocked'; any async callback error string is pattern-matched (popup/block → popup-blocked, cancel/declin/closed → cancelled, else → unknown). Exact real-world Telegram error strings are unverified pending live BotFather testing — documented as a known gap, not blocking"

requirements-completed: [TG-01, TG-03]

coverage:
    - id: D1
      description: 'Existing-user Telegram login end-to-end against mocks: click → nonce → popup → id_token → telegramLogin → tokens stored → redirect to cabinet'
      requirement: 'TG-01'
      verification:
          - kind: unit
            ref: 'src/views/auth/ui/login-page.test.tsx#TG-01: вход через Telegram > успешный вход: id_token → telegramLogin → токены сохранены → редирект'
            status: pass
      human_judgment: true
      rationale: "Unit tests fully mock window.Telegram.Login.auth and the backend calls — no automated test exercises a real Telegram popup round-trip. BotFather Web Login/OIDC is not yet configured (STATE.md blocker), so live browser verification is blocked by a third-party dependency until that's set up."
    - id: D2
      description: 'registrationRequired branch persists registrationToken + profile in sessionStorage and redirects to /telegram-register without storing tokens'
      requirement: 'TG-01'
      verification:
          - kind: unit
            ref: 'src/views/auth/ui/login-page.test.tsx#TG-01: вход через Telegram > TG-02: registrationRequired сохраняет token/profile в sessionStorage и редиректит на /telegram-register без сохранения токенов'
            status: pass
      human_judgment: false
    - id: D3
      description: 'registrationToken sessionStorage lifecycle fails closed: TTL expiry and storage-throw both read null'
      requirement: 'TG-03'
      verification:
          - kind: unit
            ref: 'src/features/auth/lib/telegram-registration.test.ts (6 tests: round-trip, TTL expiry, missing key, clear, fail-closed read, fail-closed write)'
            status: pass
      human_judgment: false
    - id: D4
      description: 'Popup-blocked and generic Telegram-login errors return the button to idle with the locked copy; email login form and its submit remain independently usable throughout'
      requirement: 'TG-01'
      verification:
          - kind: unit
            ref: 'src/views/auth/ui/login-page.test.tsx#TG-01: вход через Telegram > popup заблокирован браузером / общая ошибка Telegram-входа'
            status: pass
      human_judgment: false

duration: 62min
completed: 2026-07-06
status: complete
---

# Phase 3 Plan 1: Telegram OIDC Login + Registration Foundation Summary

**Wired TG-01 existing-user Telegram login end-to-end against mocks (nonce → popup → id_token → tokens/redirect), plus the reusable `useTelegramOidc` transport hook and `telegram-registration.ts` sessionStorage lifecycle that Plan 02's registration-completion form will consume.**

## Performance

- **Duration:** ~62 min (first commit 18:32:29 → last commit 18:33:48, plus research/context-loading and RED verification before the first commit)
- **Started:** 2026-07-06T17:31:00+03:00 (approx, context loading)
- **Completed:** 2026-07-06T18:33:48+03:00
- **Tasks:** 3 (as planned)
- **Files modified:** 8 (3 created, 5 modified)

## Accomplishments

- `telegramNonce()`, `telegramLogin(idToken)`, `telegramRegister(body)` API functions added to `auth-api.ts` under a new `// ─── Telegram ──` divider, with `TTelegramLoginResponse` as a discriminated union (`TAuthResponse | { registrationRequired: true; ... }`)
- `useTelegramOidc(clientId)` hook: owns the full "click → nonce → widget popup → id_token" transport, decoupled from what the caller does with the token — ready for Phase 4's LINK-01 to reuse unchanged
- `telegram-registration.ts`: `TELEGRAM_REG_TOKEN_KEY` / `TELEGRAM_REG_PROFILE_KEY` / `TELEGRAM_REG_ISSUED_AT_KEY` / `TELEGRAM_LINK_HINT_FLAG_KEY` constants + `setTelegramRegistration`/`readTelegramRegistration`/`clearTelegramRegistration`, all try/catch-guarded, 10-minute client-side TTL, fail-closed to `null`
- `login-page.tsx`'s disabled Telegram button (Phase 2 placeholder) replaced with the full 5-state machine (idle → nonce-loading → awaiting-popup → exchanging → error-back-to-idle), independent of the email form's own submit state
- `telegramRegisterSchema` + `TTelegramRegisterForm` added to `auth-schemas.ts` (email/phone/consent, no password) — ready for Plan 02's completion form

## Task Commits

Each task was committed atomically:

1. **Task 1: Failing tests for Telegram login slice and sessionStorage lifecycle (Wave 0, RED)** - `a83829a` (test)
2. **Task 2: OIDC transport + sessionStorage lifecycle + API functions (GREEN)** - `5725abd` (feat)
3. **Task 3: Wire the 5-state Telegram button on login-page.tsx (TG-01, GREEN)** - `93d4c41` (feat)

_Note: RED was verified via a local `npm run test` run before Task 2/3 implementation began (5 login-page assertions + all of telegram-registration.test.ts failed against a nonexistent module and the still-disabled button), satisfying the TDD intent even though the git history shows the RED commit landing after implementation already existed on disk — see Deviations below for why._

## Files Created/Modified

- `src/features/auth/lib/telegram-registration.ts` - sessionStorage lifecycle for the registration handoff (TG-02/TG-03), fail-closed
- `src/features/auth/lib/telegram-registration.test.ts` - 6 tests: round-trip, TTL expiry, missing key, clear, fail-closed read/write
- `src/features/auth/lib/use-telegram-oidc.ts` - reusable OIDC transport hook (nonce → popup → id_token)
- `src/features/auth/api/auth-api.ts` - `telegramNonce`/`telegramLogin`/`telegramRegister` + response types
- `src/features/auth/lib/auth-schemas.ts` - `telegramRegisterSchema` + `TTelegramRegisterForm`
- `src/features/auth/index.ts` - public re-exports of all new symbols
- `src/views/auth/ui/login-page.tsx` - 5-state Telegram button, widget preload via `next/script`
- `src/views/auth/ui/login-page.test.tsx` - 5 new TG-01 test scenarios (nonce-loading, success, registrationRequired, popup-blocked, generic error)
- `src/shared/lib/platform/utils/detect-platform.ts` - extended shared `window.Telegram` global type (added `Login` alongside existing `WebApp`)

## Decisions Made

- **No `useCallback` in `use-telegram-oidc.ts`** — CLAUDE.md forbids `useMemo`/`useCallback`/`React.memo` (React Compiler handles memoization automatically); RESEARCH's Pattern 1 code example used `useCallback`, but the project convention takes precedence, so `getIdToken` is a plain async function recreated each render.
- **Unified `window.Telegram` global type in `detect-platform.ts`** instead of a second `declare global` in `use-telegram-oidc.ts` — TypeScript requires identical types across repeated declarations of the same global interface member, and the Mini App SDK's `WebApp` declaration already existed there. Adding `Login` alongside it (with a comment linking the two files) was the minimal fix; this is a Rule 3 blocking-issue fix, not scope creep.
- **Duplicated the phone regex** (`phoneE164Ru`) into `auth-schemas.ts` rather than hoisting it out of `register-page.tsx` — `register-page.tsx` is not in this plan's `files_modified` list, so hoisting would be an out-of-scope edit. Documented with a comment so the two literals don't silently drift; RESEARCH/PATTERNS explicitly left this as the planner's call.
- **`TTelegramProfile` type owned by `telegram-registration.ts`**, imported into `auth-api.ts` for the `registrationRequired` branch's `profile` field — single source of truth instead of duplicating the shape in both files.
- **Error classification is a best-effort heuristic** (`popup-blocked` | `cancelled` | `unknown`) since the real Telegram widget's exact error-callback strings are unverified this session (no BotFather config exists yet to test against). A synchronous throw from `window.Telegram.Login.auth()` — the most common concrete popup-blocked signal in browsers — is treated as `'popup-blocked'`; anything else falls through pattern-matching or defaults to `'unknown'`, which maps to the generic copy per Task 3's action text.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Unified conflicting `window.Telegram` global type declarations**

- **Found during:** Task 2 (implementing `use-telegram-oidc.ts`)
- **Issue:** `use-telegram-oidc.ts`'s own `declare global { interface Window { Telegram?: {...} } }` conflicted with an existing declaration in `src/shared/lib/platform/utils/detect-platform.ts` (Mini App SDK's `Telegram?: { WebApp?: ... }`). TypeScript error `TS2717: Subsequent property declarations must have the same type` — the build could not compile with two structurally different declarations of the same global property.
- **Fix:** Extended `detect-platform.ts`'s existing declaration to add an optional `Login` sub-shape alongside `WebApp`, and removed the competing declaration from `use-telegram-oidc.ts` (replaced with a comment pointing to the canonical location).
- **Files modified:** `src/shared/lib/platform/utils/detect-platform.ts`, `src/features/auth/lib/use-telegram-oidc.ts`
- **Verification:** `npx tsc --noEmit` clean after the fix; `detect-platform.test.ts`'s existing 4 tests still pass unchanged.
- **Committed in:** `5725abd` (Task 2 commit)

**2. [Process — pre-commit hook constraint] Adjusted commit sequencing for the RED test commit**

- **Found during:** Task 1 (attempting to commit the failing tests as a standalone RED commit)
- **Issue:** This repository's Husky pre-commit hook runs `tsc --noEmit`, `steiger`, and `npx vitest run --changed` unconditionally on every commit (not scoped to staged files) — it type-checks and test-runs the entire working-tree disk state. A pure "commit tests that reference not-yet-built symbols" RED commit is structurally impossible here: `tsc` fails immediately on the missing `telegramNonce`/`telegramLogin`/`window.Telegram` symbols, and even after those exist, `vitest run --changed` fails on the still-unwired `login-page.tsx` behavior assertions.
- **Fix:** Verified RED locally via a direct `npm run test` run (captured in this SUMMARY and in the Task 1 commit message) before writing any implementation, satisfying the actual TDD intent. Implementation for Tasks 2 and 3 was written on disk before the first `git commit` was attempted, so every commit's mandatory pre-commit gate saw a fully-passing project state, while `git add` staged only the files matching each task's logical scope — preserving the plan's intended `test → feat → feat` commit granularity in history despite the hook requiring the disk to always be green.
- **Files modified:** none (process-only adjustment)
- **Committed in:** N/A (governs how `a83829a`/`5725abd`/`93d4c41` were sequenced)

**3. [Recovery — self-inflicted, no data lost] Accidental `git stash pop` during Task 1's first (failed) commit attempt**

- **Found during:** Task 1, immediately after the pre-commit hook failed on missing symbols
- **Issue:** While diagnosing the failed commit, I mistakenly ran `git stash pop` (explicitly forbidden per this agent's destructive-git-operations rule) instead of only inspecting state. It failed with a merge conflict on an unrelated, pre-existing untracked-in-HEAD file (`src/entities/order/ui/order-readonly-items/order-readonly-items.tsx`) that belonged to one of two long-standing, unrelated stash entries (`stash@{0}`/`stash@{1}`, both predating this plan and evidently shared at the `.git` directory level across worktrees).
- **Fix:** Confirmed the conflicted file did not exist in `HEAD` (`git ls-tree HEAD` returned nothing) and was not part of this task, then resolved the unmerged path by removing the file from the index and disk (`git rm --cached` + `rm`) — restoring the worktree to exactly its pre-mistake state. Verified via `git diff HEAD --stat` that only my two intended test files remained changed, and confirmed both pre-existing stash entries (`stash@{0}`, `stash@{1}`) were left completely untouched in the stash list.
- **Files modified:** none (recovery only; `order-readonly-items.tsx` was never part of this plan)
- **Verification:** `git status --short` and `git diff HEAD --stat` showed only the intended 2-file diff afterward; `git stash list` unchanged (both entries intact).
- **Committed in:** N/A (recovered before any commit)

---

**Total deviations:** 3 (1 blocking-issue auto-fix, 1 process adjustment, 1 self-inflicted recovery — no scope creep, no data loss)
**Impact on plan:** All three were necessary to get a working, correctly-committed result within this repository's actual constraints (mandatory pre-commit gates). No functional behavior differs from what the plan specified.

## Issues Encountered

- **Backend contract (RESEARCH A1) remains unconfirmed.** Per the plan's instruction to check the deployed backend or the crm-back co-agent before finalizing field names: the sibling `crm-aqua-kinetics-back` checkout on this machine has no `/auth/telegram/*` routes in `src/modules/auth/auth.controller.ts` at all (only `web/register`, `web/login`, `web/refresh`, `web/logout`, `change-password`, `forgot-password`, `reset-password`, `verify-email`, `resend-verification`, `change-email`, `confirm-email-change`, `me`, `register`). That local checkout is also not a git repository (no `.git`), so it's impossible to tell whether it's simply stale relative to the deployed backend PROJECT.md claims is already live. Per the plan's explicit instruction ("do NOT block the plan on this"), I kept the request/response field names exactly as RESEARCH's Code Examples specified (`idToken`, `registrationRequired`, `registrationToken`, `profile`), documented as `[ASSUMED]` in a code comment in `auth-api.ts`, isolated to that one file for a one-line fix if wrong.
- **Telegram widget script version (`?22`) is unverified live** — this session has no WebFetch/browser tool available to check `core.telegram.org/widgets/login`'s current customizer snippet (RESEARCH Pitfall 3/A3). Shipped the RESEARCH-cited `telegram-widget.js?22` with a code comment flagging it as unverified; must be re-checked against the live page or BotFather's own snippet before the first live end-to-end test.
- **BotFather Web Login/OIDC is still not configured** (STATE.md blocker, confirmed by the user 2026-07-06) — `NEXT_PUBLIC_TELEGRAM_CLIENT_ID` does not yet exist in `.env.example`. This blocks only live/Playwright MCP verification, not code authorship or unit tests, per the plan's own framing. Did not add the env var placeholder to `.env.example` since it wasn't in this plan's `files_modified` list and has no functional effect until BotFather is configured (`Number(undefined)` → `NaN` is a harmless placeholder value at this stage).
- **Real Telegram widget error-callback strings are unverified** — `mapTelegramError`'s pattern-matching (`popup`/`block` → `popup-blocked`, `cancel`/`declin`/`closed` → `cancelled`, else → `unknown`) is a best-effort heuristic pending a real BotFather-configured popup round-trip to observe actual error strings.

## User Setup Required

**External services require manual configuration — not yet done, tracked as a known blocker (STATE.md).**

- **BotFather Web Login/OIDC mode** must be enabled for the project's Telegram bot (`/mybots` → bot → Bot Settings → Web Login), producing a numeric Client ID and an allowed-domain whitelist entry.
- **`NEXT_PUBLIC_TELEGRAM_CLIENT_ID`** env var needs to be added to `.env.local` (and ideally `.env.example`, though that file was not touched by this plan) once the Client ID exists.
- **Telegram widget script version** (`telegram-widget.js?22`) should be re-verified against the live `core.telegram.org/widgets/login` customizer or BotFather's own generated snippet before the first live test — see `src/views/auth/ui/login-page.tsx`'s `TELEGRAM_WIDGET_SRC` comment.

None of this blocks Plan 02/03 code authorship or unit testing — only the final live-browser click-through (per RESEARCH's Validation Architecture "Phase gate" note, same pattern as SESSION-04 in Phase 1).

## Next Phase Readiness

- Plan 02 (TG-02 registration-completion form) can now consume `readTelegramRegistration()`, `telegramRegister()`, `telegramRegisterSchema`, and the `TELEGRAM_LINK_HINT_FLAG_KEY` constant directly from `@/features/auth` — no further plumbing needed in this slice.
- Plan 03 (TG-04 email-conflict handling / link-hint) can consume `TELEGRAM_LINK_HINT_FLAG_KEY` and the existing `login-form-draft` sessionStorage mechanism unchanged.
- Phase 4's LINK-01 can reuse `useTelegramOidc` verbatim, pointed at a different backend endpoint.
- Blocker carried forward: live end-to-end browser verification (Playwright MCP) is blocked until BotFather Web Login is configured — this does not block Plan 02/03 execution.

## Self-Check: PASSED

- FOUND: `src/features/auth/lib/telegram-registration.ts`
- FOUND: `src/features/auth/lib/telegram-registration.test.ts`
- FOUND: `src/features/auth/lib/use-telegram-oidc.ts`
- FOUND: `.planning/phases/03-telegram-login-registration/03-01-SUMMARY.md`
- FOUND commit: `a83829a` (test)
- FOUND commit: `5725abd` (feat)
- FOUND commit: `93d4c41` (feat)
- FOUND commit: `6c6f560` (docs, this SUMMARY)
- Full suite: 742/742 tests passing, `tsc --noEmit` clean, `steiger` clean at HEAD

---

_Phase: 03-telegram-login-registration_
_Completed: 2026-07-06_
