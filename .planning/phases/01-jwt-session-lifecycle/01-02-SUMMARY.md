---
phase: 01-jwt-session-lifecycle
plan: 02
subsystem: shared/api (token refresh)
tags: [jwt, single-flight, refresh-token, vitest-config, auth-store]
dependency_graph:
    requires: []
    provides:
        - 'api-client.ts: static top-level import of useAuthStore (no runtime await import())'
        - 'api-client.test.ts: single-flight dedup + both-tokens-replaced regression test'
        - "vitest.config.ts: poolOptions.forks.execArgv disabling Node's native experimental webstorage"
    affects:
        - src/shared/api/api-client.ts
        - src/shared/api/api-client.test.ts
        - vitest.config.ts
tech_stack:
    added: []
    patterns:
        - 'Module-level refreshPromise singleton for single-flight refresh dedup (pre-existing, unchanged)'
        - 'createDeferred() + ordered vi.fn() fetch mock for deterministic concurrency assertions'
key_files:
    created: []
    modified:
        - src/shared/api/api-client.ts
        - src/shared/api/api-client.test.ts
        - vitest.config.ts
decisions:
    - "Removed both `await import('@/shared/lib/auth')` dynamic-import sites in api-client.ts, replaced with one top-level `import { useAuthStore } from '@/shared/lib/auth'` — no import cycle (auth-store.ts does not import shared/api)"
    - "Disabled Node's native experimental global localStorage in vitest workers via poolOptions.forks.execArgv — required because Task 1's static import made auth-store.ts eagerly evaluate at module load in every test that transitively imports api-client.ts, which surfaced a pre-existing Node 22+/happy-dom localStorage collision across the whole suite (37/94 files failing on a clean baseline before this fix)"
status: complete
metrics:
    duration: '~35 min'
    completed: 2026-07-03
---

# Phase 01 Plan 02: Single-flight refresh hardening + regression tests Summary

Removed the dynamic-import indirection in `tryRefreshTokens()`/`apiClient()` (now a single static `import { useAuthStore }`) and added a deterministic regression test proving two concurrent 401s collapse into exactly one `POST /auth/web/refresh` call and that a successful refresh atomically replaces both `accessToken` and `refreshToken`.

## What Was Built

**Task 1 — static import (SESSION-02 hardening):**
`src/shared/api/api-client.ts` no longer does `await import('@/shared/lib/auth')` at the top of `tryRefreshTokens()` or inside `apiClient`'s 401-retry branch. Both call sites now use a single top-level `import { useAuthStore } from '@/shared/lib/auth'`. This removes the extra microtask hop before the `if (refreshPromise)` dedup check (Pitfall 1 in RESEARCH.md). The `refreshPromise` singleton, `setTokens(access, refresh)` call, and failure branches (`logout()`) are unchanged.

**Task 2 — regression tests (SESSION-02 + SESSION-03):**
Added one test to `api-client.test.ts` following the RESEARCH.md `createDeferred()` + ordered-fetch-mock pattern: two concurrent `apiClient()` calls both get a 401, the single `/auth/web/refresh` call is held open via a deferred, then resolved with a new token pair. Assertions: exactly one fetch call to `/auth/web/refresh` (SESSION-02), both `accessToken` and `refreshToken` in `useAuthStore` equal the new values (SESSION-03), and both original requests resolve successfully via retry. `afterEach` now also resets `useAuthStore` to its pre-test snapshot so the module-level `refreshPromise` and store state cannot leak between tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Node 22+/happy-dom native `localStorage` collision surfaced by Task 1's static import, blocking the pre-commit hook and `npm run test` on the whole suite**

- **Found during:** Task 1 commit attempt (`npx vitest run --changed` in `.husky/pre-commit`)
- **Issue:** `useAuthStore`'s Zustand store is created at module scope and calls `initAuthFromStorage()` → `localStorage.getItem(...)` immediately on import. Before Task 1, `api-client.ts` only pulled in `auth-store.ts` via a runtime `await import()`, so most test files never eagerly evaluated it. After switching to a static top-level import, every test that transitively imports `api-client.ts` (a very large fraction of the suite, since `apiClient` is imported project-wide) now eagerly evaluates `auth-store.ts` at collect time. This exposed a pre-existing, unrelated environment bug: Node 22+ registers its own experimental global `localStorage` (requires `--localstorage-file`, else it's `undefined`), which collides with happy-dom's `window.localStorage` in this Node 26 environment. Confirmed via a clean-baseline run (stashing all changes): **37 of 94 test files already failed** before any change in this plan — this bug predates this plan and is not caused by SESSION-02/03 logic, but Task 1's static import made the pre-commit hook trip over it on every commit touching `api-client.ts`.
- **Fix:** Added `poolOptions: { forks: { execArgv: ['--no-experimental-webstorage'] } }` to `vitest.config.ts`. This disables Node's native experimental webstorage in vitest's forked test workers so happy-dom's `window.localStorage` is used without collision. Verified via `execArgv` because `npm run test`'s hardcoded `NODE_OPTIONS='--experimental-require-module'` in `package.json` clobbers any externally-exported `NODE_OPTIONS`, so an env-var-only fix (e.g. exporting `NODE_OPTIONS` before running `npm run test`) would not satisfy the plan's own literal verification command; `execArgv` is passed directly to the forked Node process regardless of `NODE_OPTIONS`.
- **Files modified:** `vitest.config.ts`
- **Verification:** Full suite went from 57/94 passing (57 files, 37 failing) on the clean baseline to **94/94 test files passing, 704/704 tests passing** after the fix.
- **Commit:** `5d1e98b`

Or: N/A — see above, one deviation.

## Test Coverage Summary

- `src/shared/api/api-client.test.ts`: 7 tests (6 pre-existing + 1 new dedup/both-tokens test), all green
- Full suite: 94/94 test files, 704/704 tests green (up from 57/94 files on the pre-plan baseline, due to the vitest-config deviation fix above — this improvement is incidental/environment-level, not scope creep into other files' business logic)

## Verification Evidence

```
$ grep -c "await import('@/shared/lib/auth')" src/shared/api/api-client.ts
0

$ npx tsc --noEmit
(exit 0)

$ npm run test -- src/shared/api/api-client.test.ts
 Test Files  1 passed (1)
      Tests  7 passed (7)

$ npm run test
 Test Files  94 passed (94)
      Tests  704 passed (704)
```

## Threat Flags

None — this plan's threat model (T-1-01 mitigate, T-1-05 accept) is fully satisfied by the existing `refreshPromise` singleton (unchanged) plus the new regression test locking its behavior. The `vitest.config.ts` change is test-infrastructure only and introduces no new runtime/network/auth surface.

## Self-Check: PASSED

- FOUND: src/shared/api/api-client.ts (static import present, no dynamic import remains)
- FOUND: src/shared/api/api-client.test.ts (dedup + both-tokens test present)
- FOUND: vitest.config.ts (execArgv fix present)
- FOUND commit 4bd7ad0 (Task 1)
- FOUND commit 5d1e98b (deviation fix)
- FOUND commit 0dd6b23 (Task 2)
