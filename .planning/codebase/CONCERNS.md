# Codebase Concerns

**Analysis Date:** 2026-07-03

## Tech Debt

### Authentication implementation incomplete (blocks web platform)

**Issue:** Web auth via NextAuth (step 2 of AUTH_ADAPTER.md) is 0% implemented. All web pages currently use dev-token or unauthenticated access.

**Files:** `src/shared/lib/platform/adapters/web-adapter.ts`, `src/app/(web)/*`

**Impact:**

- Web platform cannot support real user login/registration
- All web pages currently marked `ssr: false` as temporary workaround
- Production deployment will expose dev-token usage to clients
- 6 pages have `// TODO(NextAuth)` markers: real-estate pages, checkout, orders

**Fix approach:**

1. Install NextAuth/Auth.js
2. Implement JWT strategy in WebAdapter (`getAuthHeader()` returns `Bearer <jwt>`)
3. Add `/api/auth/*` route handlers for login, OAuth (Яндекс ID), magic link
4. Coordinate with backend on JWT validation in `auth.guard.ts`
5. Convert SSR pages from CSR back to SSR with prefetchQuery + HydrationBoundary

**Timeline:** Required before web production release. Blocks ROADMAP Этап 1 completion.

### Module-level mutable state in cart sync

**Issue:** `src/features/cart/lib/use-cart-backend-sync.ts` uses module-scope variables `pendingAuth` and `pendingTimer` to track pending sync operations.

**Files:** `src/features/cart/lib/use-cart-backend-sync.ts` (lines 1-15 at top, referenced in effect at 236-264)

**Impact:**

- Violates React Concurrent Mode expectations
- Could lose updates if React Strict Mode unmounts/remounts component
- Multiple instances (if hook used in multiple places) would share mutable state
- Debugging auth token state becomes difficult
- No test coverage for race conditions

**Fix approach:**

1. Move `pendingAuth` and `pendingTimer` into component instance via `useRef`
2. Create `useCartSyncState` custom hook to encapsulate pending state
3. Add tests for concurrent scenarios (rapid store updates while pending)

**Severity:** Medium — works in practice on single-instance mount, but fragile.

### Chat polling inefficiency (N+1 refetch)

**Issue:** Per `docs/backlog/chat-polling-strategy.md`, `useInfiniteQuery` with `refetchInterval` in TanStack Query v5 refetches **all loaded pages** instead of only newest batch.

**Files:** `src/entities/chat/lib/hooks/use-chat-messages.ts` (line 38 has TODO)

**Impact:**

- 5-page chat history = 5 sequential requests every 5 seconds
- Network waste ~O(n) instead of O(1) per polling cycle
- Acceptable now (≤30 messages typical), but problematic at scale (100+ msgs)
- No user complaints yet

**Fix approach:**

1. Split into two independent hooks: `useInfiniteQuery` (pagination, no polling) + separate `useQuery` (latest-batch only, `refetchInterval: 5000`)
2. Deduplicate in UI layer by message id
3. Migrate when chats reach 100+ messages or users report slowness

**Timeline:** Deferred. Triiger: monitoring + user feedback.

## Known Bugs

### 401 Console noise during cold load

**Issue:** On cold page load, DevTools console shows 4 red error lines from 401 Unauthorized responses, though the app recovers correctly via token refresh.

**Files:** `src/shared/api/api-client.ts` (lines 59-69), `src/features/cart/lib/use-cart-backend-sync.ts:218`, `src/features/push-notifications/lib/use-push-notifications.ts:93`, `src/views/water-map/ui/real-estate-picker.tsx`

**Symptoms:**

```
[ERROR] 401 Unauthorized @ https://api.example.com/cart
[ERROR] 401 Unauthorized @ https://api.example.com/real-estate
[ERROR] 401 Unauthorized @ https://api.example.com/push/status
[ERROR] 401 Unauthorized @ https://api.example.com/cart
```

**Root cause:**

1. Cold load hydrates expired `accessToken` from localStorage
2. Endpoints (with `enabled: isAuthenticated`) fire with expired token
3. Backend returns 401
4. `apiClient` intercepts 401 → calls `tryRefreshTokens()` → retries with new token → succeeds
5. Browser DevTools logs each 4xx response automatically (not from `console.error`)

**Current mitigation:** All endpoints properly guarded, retry logic works correctly. User sees no functional impact.

**Fix approach:** Pre-flight JWT expiration detection in `apiClient` before fetch:

1. Parse JWT `exp` claim from `accessToken` (no signature check needed)
2. Before fetch, check: `if (exp * 1000 < Date.now() + 30000) → tryRefreshTokens()` (30s skew)
3. Bundle into NextAuth implementation (step 2)

**Priority:** Low (visual/UX, no functional regression). Defer to AUTH_ADAPTER step 2.

**Related:** `docs/backlog/401-auth-refresh-console-noise.md`

## Security Considerations

### Dev token exposed via WebAdapter in builds

**Issue:** `src/shared/lib/platform/adapters/web-adapter.ts:22` reads `process.env.NEXT_PUBLIC_DEMO_TOKEN` (dev token) which is inlined at build time.

**Files:** `src/shared/lib/platform/adapters/web-adapter.ts` (line 22), `.env.example`

**Risk:** If dev token accidentally gets into production builds, unauthorized API access is possible.

**Current mitigation:**

- Dev token only used for demo/testing
- `NEXT_PUBLIC_*` prefix means it's intentionally exposed (client-side)
- Pre-commit hook + CI should catch dev env vars in production builds

**Recommendations:**

1. Add CI check: fail build if `NEXT_PUBLIC_DEMO_TOKEN` is set during production build
2. Document: dev token should NEVER be deployed to production
3. Rotate dev token monthly (store in `.env.example` as placeholder)
4. Implement NextAuth ASAP (removes need for dev token)

**Timeline:** Required before production auth rollout.

### Image upload size limit not enforced on backend

**Issue:** `src/features/smart-search/ui/smart-search-overlay/smart-search-overlay.tsx:23` limits upload to 5MB client-side only.

**Files:** `src/features/smart-search/ui/smart-search-overlay/smart-search-overlay.tsx`

**Risk:**

- Malicious client can bypass 5MB limit and upload larger files
- Backend may accept, causing DoS or storage exhaustion
- No validation mentioned in smart-search.api backend

**Current mitigation:** Client-side check prevents 99% of user mistakes.

**Recommendations:**

1. Add server-side validation: reject uploads > 5MB in `/smart-search` endpoint (slovo backend)
2. Add rate limiting per user: max 10 searches/hour (throttle-tracker client-side only)
3. Document file type restrictions on backend

**Timeline:** Coordinate with slovo-backend in handoff docs.

### CORS/credentials include on cross-origin requests

**Issue:** `src/shared/api/api-client.ts:55` sets `credentials: 'include'` on all requests.

**Files:** `src/shared/api/api-client.ts`, `src/shared/api/slovo-api-client.ts`

**Risk:** If API URL differs from frontend domain (e.g., different subdomains), credentials are sent without explicit CORS agreement.

**Current mitigation:** Backend has CORS config (not visible in frontend), presumably allows this.

**Recommendations:**

1. Document: frontend origin must be whitelisted in backend CORS config
2. Add comment explaining why `credentials: 'include'` is necessary (httpOnly cookie auth)
3. Verify CORS headers in CI/staging (pre-deploy check)

## Performance Bottlenecks

### Water map canvas component oversized (987 lines)

**Issue:** `src/views/water-map/ui/water-map-canvas.tsx` is 987 lines with multiple `useEffect` hooks managing MapLibre state.

**Files:** `src/views/water-map/ui/water-map-canvas.tsx`

**Cause:**

- Map initialization + 6 data sources (cells, coverage, depth, points, stores, route)
- Styling + color expressions (100+ lines)
- Layer toggling, theme switching, bounds snapping
- All state in one component

**Impact:**

- Hard to reason about data flow (multiple dependent effects)
- Slow tree reconciliation on re-renders
- Difficult to test individual map features
- Performance issues on low-end devices

**Improvement path:**

1. Extract data layers into custom hook: `useHeatmapLayer(mapRef, heatmap, mapReady)`
2. Extract styling logic into separate `water-map-styles.ts`
3. Split into sub-components: `<MapCanvas>` + `<CellsLayer>` + `<DepthLayer>` + `<StoresLayer>`
4. Memoize heavy computations (color expressions)

**Timeline:** Phase 2 refactoring. Safe to defer if current performance acceptable.

### Smart search overlay complexity (608 lines)

**Issue:** `src/features/smart-search/ui/smart-search-overlay/smart-search-overlay.tsx` manages 4 states (idle, loading, results, error) with image upload + AI pipeline visualization.

**Files:** `src/features/smart-search/ui/smart-search-overlay/smart-search-overlay.tsx`

**Potential issues:**

- Multiple conditional renders (4 branches)
- Image handling + base64 encoding inline
- Photo thumbnail placeholder pending Phase 1.5

**Mitigation:** State logic separated to `smart-search.store.ts` (Zustand). UI is mostly a rendering layer. Phase 1.5 will split into sub-components.

**Current status:** Acceptable. Phase 1 marked complete, Phase 1.5 queued for address flow split.

## Fragile Areas

### Map layer state synchronization during theme change

**Issue:** `src/views/water-map/ui/water-map-canvas.tsx:551-721` handles theme switching by calling `map.setStyle()`, which clears all sources/layers, requiring reattach.

**Files:** `src/views/water-map/ui/water-map-canvas.tsx`

**Why fragile:**

- `setStyle()` is async (listens to `styledata` event)
- Multiple dependent effects on theme change
- `eslint-disable react-hooks/exhaustive-deps` on line 720 — dependency logic is complex
- If theme change races with data updates, layers may not reattach correctly

**Safe modification:**

1. Test theme switching with active heatmap/cells layers
2. Add explicit error handling in `reattach` function
3. Consider moving style management to custom hook with clearer semantics

**Test coverage:** No explicit theme-switching test (likely covered by e2e).

### MAX Mini App adapter is stubbed (TODO everywhere)

**Issue:** `src/shared/lib/platform/adapters/max-adapter.ts` has 6 TODO comments, all methods return null/false.

**Files:** `src/shared/lib/platform/adapters/max-adapter.ts`

**Impact:**

- MAX Mini App will not authenticate
- Falls back to web auth (won't work on MAX platform)
- Blocks ROADMAP Этап 2

**Fix approach:** Parallel with step 3 (Telegram Mini App). SDK docs say MAX SDK is identical to Telegram.

**Timeline:** After Telegram auth complete (step 3 dependent).

### Real estate picker async address selection (Phase 1.5 deferred)

**Issue:** Smart search "По адресу" chip currently only prefills query. Full RealEstatePicker reuse through chip flow deferred to Phase 1.5.

**Files:** `src/features/smart-search/ui/smart-search-overlay/smart-search-overlay.tsx:145`, `docs/CLAUDE.md` ("Address-flow" note)

**Blocking:** Phase 1.5 requires moving RealEstatePicker component to features/ + updating store flow.

**Current behavior:** Manual address input only; the chip provides a shortcut but no picker modal.

## Test Coverage Gaps

### Auth refresh retry logic (apiClient)

**Issue:** `src/shared/api/api-client.ts` (lines 59-69, 85-123) has token refresh logic but no direct test coverage.

**Files:** `src/shared/api/api-client.ts`, `src/shared/api/api-client.test.ts`

**Risk:**

- Refresh promise coordination (line 94-96) could deadlock
- Multiple 401 responses could retry infinitely
- Token extraction from localStorage could be stale

**What's not tested:**

- Refresh failure scenario (invalid refresh token)
- Multiple concurrent 401 requests (does promise dedup work?)
- Refresh succeeds but new token is still expired

**Recommendation:**

1. Add test: `apiClient` + initial 401 + successful refresh + retry → success
2. Add test: refresh failure → logout
3. Add test: two concurrent 401 requests → single refresh call (promise dedup)

**Timeline:** Bundle with NextAuth implementation (step 2).

### Smart search mutation edge cases

**Issue:** `src/features/smart-search/api/use-smart-search.ts` handles file upload + AI pipeline calls but limited edge-case tests.

**Files:** `src/features/smart-search/api/use-smart-search.ts`, related tests

**Gaps:**

- Image processing timeout (how long does vision inference take?)
- Network interruption during file upload
- Cache hit behavior (backend caches by SHA256 24h)
- Throttle counter exhausted scenario

**Recommendation:**

1. Test: image upload > 5MB → error message
2. Test: vision timeout after 30s → user sees "AI processing took too long"
3. Test: throttle `< 3 remaining` → show counter
4. Test: throttle `>= 3 remaining` → hide counter (per CLAUDE.md)

## Missing Critical Features

### NextAuth web auth (0% complete)

**Blocks:** Web platform login, profile, checkout, order history

**Dependency chain:**

1. Implement NextAuth adapter in frontend
2. Backend JWT validation strategy (waiting on frontend)
3. Magic link + OAuth flow pages
4. Convert SSR pages to proper SSR

**Timeline:** Critical for Этап 1 completion (ROADMAP).

### Telegram Mini App auth (0% complete)

**Blocks:** Full Telegram Mini App deployment (currently web-only adapter)

**Dependency chain:**

1. Implement TelegramAdapter (most code exists, just needs SDK init)
2. Backend initDataRaw validation (likely already done)
3. Testing on actual Telegram environment

**Timeline:** Этап 2 (after web auth stable).

### MAX Mini App (0% complete)

**Blocks:** MAX Mini App platform

**Files:** `src/shared/lib/platform/adapters/max-adapter.ts` (all stubs)

**Timeline:** Этап 2 parallel with Telegram, or Этап 3.

## Dependencies at Risk

### MapLibre GL JS version management

**Issue:** `src/views/water-map/` heavily depends on MapLibre GL 5.20.1 API (sources, layers, expressions).

**Files:** `src/views/water-map/`, `package.json:29`

**Risk:**

- Major version bump could break layer API
- Color expression format `['heatmap-color', ...]` is fragile to syntax changes
- No abstraction layer (direct maplibregl calls)

**Mitigation:**

1. Lock version in `package.json` (not `^5.20.1`)
2. Document: MapLibre version must be coordinated with color-scale.ts expressions
3. Add e2e test for map rendering (Playwright MCP recommended)

**Timeline:** Before production. Add pre-commit hook to prevent accidental bumps.

## Architectural Issues

### FSD compliance: several eslint-disables without clear boundaries

**Issue:** Multiple `eslint-disable` comments throughout codebase, some documented, some not.

**Files:**

- `src/features/smart-search/ui/smart-search-overlay/smart-search-overlay.tsx:407,500` (img element — justified)
- `src/features/real-estate/ui/real-estate-wizard/real-estate-wizard.tsx:109` (exhaustive-deps — justified)
- `src/views/water-map/ui/water-map-canvas.tsx:548,720` (exhaustive-deps — complex logic)
- `src/views/water-map/ui/water-map-splash.tsx:49` (setState in effect — one-time SSR safe)
- `src/views/water-map/ui/equipment-modal.tsx:142` (img element — justified)

**Per CLAUDE.md:** Eslint-disable is forbidden; code should be rewritten instead.

**Risk:** If disabled rules catch real bugs, they won't be visible.

**Recommendation:**

1. Keep disables with clear explanations (img element, SSR safe setState)
2. Refactor to remove: water-map exhaustive-deps (split effect logic), Zustand setter dependency
3. Add pre-commit hook to flag new eslint-disable comments

**Timeline:** Medium priority. Phase 2 cleanup.

---

_Concerns audit: 2026-07-03_
