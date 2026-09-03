# External Integrations

**Analysis Date:** 2026-07-03

## APIs & External Services

**CRM Backend (Primary API):**

- Service: crm-aqua-kinetics-back (NestJS)
- Purpose: Main backend for user, order, catalog, cart, payment, real estate, chat, installed equipment
- SDK/Client: `src/shared/api/api-client.ts` (custom fetch wrapper)
- Environment vars:
    - `NEXT_PUBLIC_API_URL` (client-side, default: `http://localhost:3000`)
    - `BUILD_API_URL` (server build-time override)
    - `INTERNAL_API_URL` (Docker internal, default: `http://crm-back:3000`)
- Auth: Bearer JWT token (in Authorization header, `credentials: 'include'`)
- Features:
    - Token refresh: `POST /auth/web/refresh` (auto-retry on 401)
    - Swagger docs: `GET /api/docs`
    - All endpoints proxied via Next.js rewrites: `/api/*`

**Slovo API (Water Analysis):**

- Service: slovo (NestJS monorepo)
- Purpose: Water analysis heatmap, depth prediction, equipment suggestions, smart search
- SDK/Client: `src/shared/api/slovo-api-client.ts` (separate lightweight fetch wrapper)
- Endpoints:
    - `GET /heatmap` - Water analysis heatmap
    - `GET /predict` - Water depth prediction
    - `GET /depth-map` - Depth map data
    - `GET /aquifer-stats` - Aquifer statistics
    - `GET /points` - Analysis points
    - `POST /equipment-suggest` - Equipment recommendation based on water analysis
- Environment vars:
    - `NEXT_PUBLIC_SLOVO_API_URL` (client-side, default: `http://localhost:3101`)
    - `BUILD_SLOVO_API_URL` (server build-time override)
    - `INTERNAL_SLOVO_API_URL` (Docker internal, default: `http://slovo-api:3101`)
- Auth: None (public endpoints, throttled by IP)
- Credentials: `'omit'` (not sent with request)
- Features: Separate from main API, mocked via `NEXT_PUBLIC_SMART_SEARCH_MOCK=1`
- Proxied via Next.js rewrite: `/smart-search/*`

**Telegram Bot API:**

- Service: Telegram (via @tma.js/sdk-react)
- Purpose: Telegram Mini App SDK for user auth, haptics, back button, theme, invoice
- SDK/Client: `@tma.js/sdk-react` version 3.0.16
- Implementation: `src/shared/lib/platform/adapters/telegram-adapter.ts`
- Features:
    - initData: User authentication data (signed, validated on backend via BOT_TOKEN)
    - hapticFeedback: Device vibration (light, medium, heavy, soft, rigid)
    - backButton: Custom back button in mini app
    - themeParams: Dark/light theme from Telegram
    - invoice: Payment invoice dialog
    - viewport: Expand/fullscreen
- Env: BOT_TOKEN (for validation, stored in backend only)
- Detection: `src/shared/lib/platform/utils/detect-platform.ts`

**MAX Mini App (Future):**

- Service: MAX (messaging app)
- Purpose: MAX Mini App platform
- SDK/Client: `@tma.js/sdk-react` compatible (parallel implementation expected)
- Implementation: `src/shared/lib/platform/adapters/max-adapter.ts` (skeleton)
- Auth: initData (same validation pattern as Telegram)

## Data Storage

**Backend Database:**

- Type: PostgreSQL (assumed, managed by crm-aqua-kinetics-back)
- Purpose: Users, orders, products, real estate, services, installed equipment, chats
- Connection: Managed by NestJS backend (not direct from frontend)
- Schema includes:
    - User (with UUID column for multi-platform identity)
    - UserIdentity (platform + externalId → userId mapping)
    - Order, OrderItem
    - Product, ProductVariant
    - RealEstate (B2B: businessType, isPublic, managerId fields)
    - Service, InstalledEquipment
    - Chat, ChatMessage
    - Zones (OSM-based service areas)
    - Payment (ЮKassa reference, Telegram Payment reference)

**S3 Object Storage:**

- Service: AWS S3 (or S3-compatible, e.g., MinIO)
- Purpose: File uploads (chat media, product images, service photos)
- Base URL: `process.env.NEXT_PUBLIC_S3_PUBLIC_URL` (default: empty)
- Usage: `src/entities/chat/lib/get-storage-url.ts`
- Pattern: Prepend S3 URL to relative paths (e.g., `/uploads/media-id.jpg`)
- Client upload: Handled by backend via pre-signed URLs (typical S3 pattern)

**Client-side Persistence:**

- localStorage: Auth tokens, user data, search history, cart state
    - Keys:
        - `prostor_access_token` - JWT access token
        - `prostor_refresh_token` - JWT refresh token
        - `prostor_user` - Cached user object (JSON)
    - Zustand persist middleware: Cart, search filters, UI preferences
- sessionStorage: Not used explicitly (can be added for temporary state)
- Cookies:
    - `access_token` - Set on login (1-day expiry, Secure on HTTPS, SameSite=Lax)
    - Managed by `src/shared/lib/auth/auth-store.ts`

**Caching:**

- TanStack React Query: In-memory cache on client
    - Default stale time: 60 seconds
    - Default retry: 1 attempt on network failure
    - Refetch on window focus: enabled
    - Pattern: Stale-While-Revalidate (show cached, update in background)

## Authentication & Identity

**Web Platform:**

- Type: Custom implementation (JWT-based)
- Flow:
    1. POST `/auth/web/login` with email + password
    2. Backend returns `{ accessToken, refreshToken, user }`
    3. Frontend stores in localStorage + httpOnly cookie
    4. All requests: `Authorization: Bearer ${accessToken}`
    5. On 401: POST `/auth/web/refresh` with refreshToken
    6. Auto-retry initial request with new token
- Logout: Clear localStorage, invalidate refresh token
- Implementation: `src/shared/api/api-client.ts`, `src/shared/lib/auth/auth-store.ts`
- Store: Zustand with localStorage persistence

**Telegram Mini App:**

- Type: initDataRaw (signed, backend-validated)
- Flow:
    1. Client extracts `initDataRaw` from `window.TelegramWebApp.initDataRaw`
    2. POST `/auth/telegram` with `initDataRaw`
    3. Backend validates signature with BOT_TOKEN
    4. Backend returns `{ accessToken, refreshToken, user }`
    5. Same token flow as Web
- User identity: Phone number + Telegram user ID (via UserIdentity table)
- Implementation: `src/shared/lib/platform/adapters/telegram-adapter.ts`

**MAX Mini App:**

- Type: initData (parallel to Telegram)
- Flow: Same as Telegram, POST `/auth/max` with initData
- User identity: Phone number + MAX user ID (via UserIdentity table)
- Implementation: `src/shared/lib/platform/adapters/max-adapter.ts` (WIP)

**User Roles:**

- CLIENT - Regular user (client viewing/managing orders and installations)
- SERVICE - Installation technician (viewing work schedule, accepting jobs)
- CURATOR - Service coordinator (managing masters, clients, orders for region)
- MANAGER - B2B object manager (managing public real estate, sales partner API)
- ADMIN - System administrator

## Payment Integrations

**Web Payment:**

- Provider: ЮKassa (Russian payment processor)
- Method: Iframe/widget (details not visible in frontend, handled by backend)
- SDK: Backend integration only (no explicit client SDK found)
- Flow: User selects payment method → backend creates ЮKassa invoice → frontend shows iframe
- Env: No client-side env vars (backend has API key)

**Telegram Payments:**

- SDK: `@tma.js/sdk-react` → `invoice` API
- Flow: `adapter.openInvoice(invoiceUrl)` → Telegram handles payment UI
- Implementation: `src/shared/lib/platform/adapters/telegram-adapter.ts`
- Backend: Webhook for payment confirmation (from Telegram)

**MAX Payments:**

- SDK: @tma.js/sdk-react compatible (parallel implementation expected)
- Implementation: `src/shared/lib/platform/adapters/max-adapter.ts`
- Status: Planned for phase 2

## Geolocation & Maps

**Map Tiles:**

- Provider: MapTiler (via next.config.ts image remotePatterns)
- Base map: OpenStreetMap-compatible tiles
- Renderer: MapLibre GL JS (open-source WebGL renderer)
- Library: react-map-gl/maplibre (React wrapper)
- Usage:
    - Route maps in master work schedule: `src/features/master-work-days/ui/route-map/route-map.tsx`
    - Water analysis map: `src/views/water-map/ui/water-map-canvas.tsx`
    - Equipment list on map: implied by water-map

**Geocoding:**

- Service: AHunter (via backend, frontend makes requests through proxy)
- Purpose: Address → coordinates, coordinates → address
- Implementation: Backend endpoint (not visible in frontend code)
- Use case: Real estate management, location-based searches

**Routing:**

- Service: OSRM (Open Source Routing Machine)
- Repository: crm-aqua-kinetics-osm (separate repo)
- Purpose: Calculate routes for service masters
- Use case: Master work schedule, estimated travel time
- Implementation: Backend integration (frontend receives pre-calculated routes)

**Geospatial Analysis:**

- Library: @turf/turf (client-side analysis)
- Purpose: Distance calculations, polygon operations, point-in-polygon checks
- Use case: Water depth prediction, zone boundaries, service area calculations

## Monitoring & Observability

**Error Tracking:**

- Service: Not detected (no Sentry, Rollbar, or similar SDK found)
- Current approach: Error boundaries (`react-error-boundary`) + console logs
- Toast notifications for user-facing errors: `react-toastify`

**Logging:**

- Strategy: Browser console (dev) + request logging via TanStack Query
- No centralized log aggregation visible
- API client logs errors via ApiError and SlovoApiError classes

**Performance Monitoring:**

- No explicit analytics SDK (no Google Analytics, Posthog, etc.)
- Next.js Core Web Vitals: ESLint rule enabled
- Potential: VAPID key for Web Push (config exists, not used yet)

**Debugging:**

- MSW (Mock Service Worker): Intercepts fetch for isolated testing
- Happy DOM: JSDOM alternative for faster unit tests
- Vitest: Test runner with built-in debugging

## CI/CD & Deployment

**Hosting:**

- Docker container (multi-stage build)
- Docker Compose network: `crm_network_prod`
- Port: 3000 (Next.js server)
- Health check: HTTP GET to `/`
- Restart policy: always

**CI Pipeline:**

- Status: Not set up (GitHub Actions planned)
- Planned: Lint + test on PR, auto-deploy on merge to main

**Build Process:**

- Dockerfile: 3 stages (deps, builder, runner)
- Output: Next.js standalone (`output: 'standalone'`)
- Node version: 22.16-slim
- Cache: npm cache mount for install step

## Webhooks & Callbacks

**Incoming Webhooks:**

- Not explicitly configured in frontend
- Expected from Telegram Payments (handled by backend)
- Expected from ЮKassa (handled by backend)

**Outgoing Webhooks:**

- Not visible in frontend code
- Backend-to-backend communication (e.g., to Telegram Bot API)

## Development Mocking

**API Mocking:**

- MSW 2.12.11: Mock Service Worker for unit tests
- Usage: `msw` handlers in test files (not found in example, but in package.json)
- Purpose: Isolate unit tests from backend dependencies

**Smart Search Mock:**

- Flag: `NEXT_PUBLIC_SMART_SEARCH_MOCK=1`
- Purpose: Simulate water analysis API with hardcoded delays for UI development
- Implementation: `src/features/smart-search/` (uses mock timers for 3-stage pipeline)

**Platform Mock:**

- Telegram environment mock: `src/shared/lib/platform/utils/mock-telegram-env.ts`
- Purpose: Simulate Telegram Mini App in browser for local development
- Detection: `src/shared/lib/platform/utils/detect-platform.ts`

## Integration Patterns

**API Client Wrapper:**

- Main API: `src/shared/api/api-client.ts` (handles 401 refresh, auth headers, FormData)
- Slovo API: `src/shared/api/slovo-api-client.ts` (lightweight, no auth, no refresh)
- Query client: `src/shared/api/query-client.ts` (TanStack Query defaults: 60s stale, 1 retry)

**TanStack Query Hooks:**

- Pattern: `*.api.ts` files export `useQuery` / `useSuspenseQuery` hooks
- Server-side: `useQuery` with `prefetchQuery` for ISR/SSR
- Client-side: `useSuspenseQuery` for required data (inside Suspense boundary)
- Hydration: `HydrationBoundary` from `@tanstack/react-query`

**State Synchronization:**

- Zustand stores: Persist to localStorage, recover on init
- TanStack Query: Refetch on window focus (multi-client sync)
- Pattern: Stale-While-Revalidate (optimistic UI + background update)

**Error Handling:**

- ApiError class: Custom error with status, statusText, data
- SlovoApiError class: Similar for Slovo API
- Error boundaries: React Error Boundary wrapper for component-level recovery
- Toast notifications: For user-facing errors

---

_Integration audit: 2026-07-03_
