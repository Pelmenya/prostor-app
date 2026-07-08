<!-- refreshed: 2026-07-03 -->

# Architecture

**Analysis Date:** 2026-07-03

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Next.js App Router (Entry Points)                        │
│       app/(web) | app/(miniapp) | app/(dashboard) | app/api/                │
│  `src/app/`                                                                   │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────┐
│               Views Layer (Page Composition)                                  │
│       CatalogPage, CheckoutPage, WaterMapPage, DashboardPage                │
│  `src/views/`                                                                 │
├──────────────────────┬──────────────────────┬──────────────────────────────┤
│   ├─ import widgets  │   ├─ import features │   └─ import entities         │
│   └─ from (web)      │   └─ from features   │      from entities           │
│      layout          │      layer           │      layer                   │
└──────────────────────┴──────────────────────┴──────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────────┐
        │                          │                              │
┌───────▼────────────┐  ┌──────────▼────────────┐  ┌─────────────▼──────────┐
│    Widgets Layer   │  │  Features Layer      │  │  Entities Layer        │
│  (UI Compositions) │  │  (Business Logic)    │  │  (Domain Objects)      │
│                    │  │                      │  │                        │
│ Header             │  │ SmartSearch          │  │ Product (API + UI)     │
│ Footer             │  │ Auth                 │  │ Cart (API + UI)        │
│ Sidebars           │  │ Checkout             │  │ Order (API + UI)       │
│ ChatWindow         │  │ Cart                 │  │ User (API + UI)        │
│ OrderChatView      │  │ Catalog              │  │ RealEstate (API + UI)  │
│ MasterProfile      │  │ Orders               │  │ Chat (API + UI)        │
│ CuratorSidebar     │  │ MasterPublic         │  │ WaterAnalysis (API)    │
│                    │  │ MasterSettings       │  │ InstalledEquipment     │
│ `src/widgets/`     │  │                      │  │ ServiceZone            │
│                    │  │ `src/features/`      │  │ Delivery               │
│                    │  │                      │  │ `src/entities/`        │
└────────────────────┘  └──────────────────────┘  └────────────────────────┘
        │                       │                          │
        └───────────────────────┼──────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────────────┐
│                    Shared Layer (Utilities & Abstraction)                     │
│                                                                               │
│  API Client        │  Platform Adapter      │  Types         │  UI Library   │
│  (src/shared/api/) │  (src/shared/lib/      │  (src/shared/  │  (src/shared/ │
│                    │   platform/)           │   model/)      │   ui/)        │
│  - apiClient()     │                        │                │               │
│  - TanStack Query  │  - PlatformAdapter     │  - TProduct    │  - Input      │
│  - QueryProvider   │  - TelegramAdapter     │  - TUser       │  - Button     │
│  - ApiError        │  - MaxAdapter          │  - TOrder      │  - Modal      │
│                    │  - WebAdapter          │  - TCart       │  - Card       │
│  Zustand Stores    │  - usePlatform()       │  - TService    │  - etc.       │
│  - useAuthStore    │  - usePlatformUser()   │                │               │
│  - useCartStore    │                        │                │  Icons        │
│                    │                        │                │  Hooks        │
│ `src/shared/`      │                        │                │  Lib (format, │
│                    │                        │                │  retry, etc)  │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component            | Responsibility                                                        | File                       |
| -------------------- | --------------------------------------------------------------------- | -------------------------- |
| **App Router**       | Routing, layout composition, SSR/SSG data prefetch                    | `src/app/`                 |
| **Views**            | Page composition, importing widgets/features                          | `src/views/`               |
| **Widgets**          | Complex UI compositions (Header, Footer, sidebars)                    | `src/widgets/`             |
| **Features**         | Business logic spanning multiple entities (auth, checkout, cart sync) | `src/features/`            |
| **Entities**         | Domain objects (Product, Order, User) with API & UI components        | `src/entities/`            |
| **Shared API**       | HTTP client, TanStack Query, Zustand stores                           | `src/shared/api/`          |
| **Platform Adapter** | Telegram/MAX/Web abstraction for auth, haptic, payments               | `src/shared/lib/platform/` |
| **Shared Types**     | Single source of truth for domain types (TProduct, TUser, etc)        | `src/shared/model/`        |
| **Shared UI**        | Reusable UI components (Input, Button, Modal, Card, etc)              | `src/shared/ui/`           |

## Pattern Overview

**Overall:** Feature-Sliced Design 2.1 (FSD 2.1) adapted for Next.js App Router with Adapter Pattern for multi-platform abstraction.

**Key Characteristics:**

- **Strict layer isolation** — code flows downward only (`app → views → widgets → features → entities → shared`)
- **Public API per slice** — each slice exports through `index.ts`, imports go through that public API
- **No circular imports** — enforced by Steiger linter
- **Platform abstraction** — business logic is platform-agnostic, platform-specific code isolated in `PlatformAdapter`
- **Server-first rendering** — SSG/ISR for public data, SSR for user data, CSR for interactive views (miniapp, dashboard)

## Layers

### **App Router (`src/app/`)**

**Purpose:** Routing, layout composition, thin SSR/SSG handlers. No business logic or UI composition beyond layout wrapper.

**Location:** `src/app/`

**Contains:**

- Layout group directories: `(web)`, `(miniapp)`, `(dashboard)`
- Route `page.tsx` files — thin wrappers that:
    1. Prefetch data on server (TanStack Query)
    2. Dehydrate query cache
    3. Import and render page from `src/views/`
- Layout files (`layout.tsx`) — provide providers and chrome (Header, Footer)
- API routes (`api/`) — BFF endpoints, NextAuth

**Depends on:** `src/views`, `src/shared/api`, `src/entities`, `src/features`

**Used by:** Browser, Next.js framework

**Example:** `/src/app/(web)/catalog/page.tsx`

```typescript
// Thin wrapper: prefetch + hydrate + render view
export default async function CatalogRoute() {
    const queryClient = getQueryClient();
    await queryClient.prefetchQuery({
        queryKey: productKeys.subGroups(MAIN_CATALOG_ID),
        queryFn: () => fetchSubGroups(MAIN_CATALOG_ID),
    });
    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CatalogPage />
        </HydrationBoundary>
    );
}
```

### **Views (`src/views/`)**

**Purpose:** Page composition — assemble widgets, features, and entities into complete pages. `views` replaces FSD's `pages` to avoid conflict with Next.js Pages Router.

**Location:** `src/views/`

**Contains:**

- Directory per page: `water-map/`, `catalog/`, `checkout/`, `orders/`, etc.
- `ui/` subdirectory: page component and child components specific to that page
- `model/` subdirectory (when needed): Zustand store for page-specific state
- `index.ts`: exports main page component
- Page components are **client components** (`'use client'`) when they need interactivity, **server components** otherwise

**Depends on:** `src/widgets`, `src/features`, `src/entities`, `src/shared`

**Used by:** `src/app/` page.tsx files

**Pattern:** Views compose features and entities. Page component imports from other layers through public APIs.

**Example:** `/src/views/water-map/ui/water-map-page.tsx`

```typescript
// Composes features and entities
import { SmartSearchInput, SmartSearchOverlay } from '@/features/smart-search';
import { useWaterMapStore } from '../model';
import { WaterMapCanvas } from './water-map-canvas';
import { LayerPanel } from './layer-panel';

export function WaterMapPage() {
    const [selectedPoint, setSelectedPoint] = useState(null);
    // ...composes sub-components and features
}
```

### **Widgets (`src/widgets/`)**

**Purpose:** Complex, reusable UI compositions spanning multiple pages. Examples: Header, Footer, sidebars, modals.

**Location:** `src/widgets/`

**Contains:**

- Directory per widget: `header/`, `footer/`, `chat-window/`, `order-chat-view/`, etc.
- `ui/` subdirectory: widget component and child components
- `index.ts`: exports main widget component
- May have `model/` (Zustand store) if widget has complex state

**Depends on:** `src/entities`, `src/shared`, `src/features` (for feature-specific widgets like `curator-sidebar`)

**Used by:** Layout files, Views

**Example:** `/src/widgets/header/ui/header.tsx` — shared across all `(web)` pages

### **Features (`src/features/`)**

**Purpose:** Business logic that spans multiple entities or pages. Examples: multi-step forms (Checkout), authentication flows, search, cart synchronization.

**Location:** `src/features/`

**Contains:**

- Directory per feature: `auth/`, `checkout/`, `cart/`, `smart-search/`, `orders/`, etc.
- Subdirectories:
    - `api/` — TanStack Query hooks for API calls specific to this feature
    - `model/` — Zustand stores, business logic, types
    - `lib/` — utility functions, hooks, validators (Zod schemas)
    - `ui/` — React components for this feature
- `index.ts`: exports public API (stores, hooks, components, types)

**Depends on:** `src/entities`, `src/shared`

**Used by:** `src/views`, `src/widgets`, other features

**Pattern:** Features may compose entities, but don't directly depend on other features (cross-feature logic goes into views).

**Examples:**

- `@/features/auth` — login, register, logout, token refresh
- `@/features/checkout` — address selection, executor search, order scheduling
- `@/features/smart-search` — AI vision search, recent searches, chip suggestions
- `@/features/cart` — add/remove items, synchronize with backend

### **Entities (`src/entities/`)**

**Purpose:** Domain objects and their business logic. Each entity owns its API, UI components, and business logic.

**Location:** `src/entities/`

**Contains:**

- Directory per entity: `product/`, `order/`, `user/`, `cart/`, `real-estate/`, etc.
- Subdirectories:
    - `api/` — TanStack Query hooks (`useProduct`, `useProducts`, etc.) and raw API calls
    - `model/` — Zustand stores (if entity has complex state like Cart), business logic, types
    - `ui/` — React components for displaying this entity (ProductCard, OrderItem, etc.)
    - `lib/` — utility functions specific to this entity (mappers, calculators)
- `index.ts`: exports public API (hooks, components, types)
- Types are defined locally but reexported from `src/shared/model/` (single source of truth)

**Depends on:** `src/shared` only

**Used by:** `src/features`, `src/views`, `src/widgets`

**Pattern:** Entities are domain objects. They define:

- **Types:** `TProduct`, `TOrder`, `TUser` (shared in `src/shared/model/`)
- **API:** TanStack Query hooks for fetching/mutating entity data
- **UI:** Reusable components for displaying entity data (ProductCard, OrderItem)
- **Business logic:** Calculators, mappers, validators

**Examples:**

- `@/entities/product` — exposes `useProduct`, `useProducts`, `ProductCard`, `TProduct`
- `@/entities/cart` — exposes `CartItem`, `CartItemList`, `useCartStore`, `TCartItem`
- `@/entities/order` — exposes `OrderCard`, `useOrder`, `TOrder`

### **Shared (`src/shared/`)**

**Purpose:** Platform-agnostic utilities, types, and components used across all layers.

**Location:** `src/shared/`

**Subdirectories:**

- **`api/`** — HTTP client and TanStack Query setup
    - `apiClient()` — wrapper around fetch with auth, error handling, token refresh
    - `QueryProvider` — wraps app with TanStack QueryClientProvider
    - `getQueryClient()` — creates server-side QueryClient (per-request cache)
    - `ApiError` — custom error class for API failures

- **`lib/`** — Utilities
    - `platform/` — **Adapter Pattern implementation** (see below)
        - `types.ts` — `TPlatformAdapter` interface
        - `adapters/` — `TelegramAdapter`, `MaxAdapter`, `WebAdapter` implementations
        - `factory.ts` — `createPlatformAdapter()` factory
        - `hooks/` — `usePlatform()`, `useAuth()` platform-agnostic hooks
    - `auth/` — Zustand auth store, token management
    - `hooks/` — Generic hooks (useMediaQuery, useDaisyTheme, etc.)
    - `format/`, `formatters/` — Utility functions (formatPrice, formatDate, etc.)

- **`model/`** — Domain types (single source of truth)
    - `t-product.ts` → `TProduct`
    - `t-order.ts` → `TOrder`
    - `t-user.ts` → `TUser`
    - `t-cart-item.ts` → `TCartItem`
    - `index.ts` — reexports all types

- **`ui/`** — Reusable UI components
    - `input-field/` — form inputs
    - `button/`, `icon-button/` — buttons
    - `modal/`, `bottom-sheet-modal/`, `compact-modal/` — modals
    - `card-wrapper/`, `card-image/`, `cart-card-wrapper/` — card layouts
    - `page-container/`, `page-title/` — page chrome
    - `icons/` — SVG icon components
    - `breadcrumbs/`, `star-rating/`, `counter/`, `infinite-list/` — utilities
    - `query-boundary/`, `page-spinner/`, `page-error/` — data loading states

- **`config/`** — Constants
    - `API_URL`, `APP_NAME`, `MAIN_CATALOG_ID`, etc.

**Depends on:** Nothing (bottom layer)

**Used by:** All other layers

## Data Flow

### **Primary Request Path (E.g., Catalog Page)**

1. **Browser → Route:** User navigates to `/catalog`
2. **Next.js App Router → Server:** `src/app/(web)/catalog/page.tsx` executes
3. **Server Prefetch:** Page calls `queryClient.prefetchQuery()` → fetches from backend
4. **Dehydrate:** Query cache dehydrated and passed to client via `HydrationBoundary`
5. **Render View:** `<CatalogPage />` from `src/views/catalog` imports
6. **View Composition:** `CatalogPage` imports `@/entities/product` hooks and widgets
7. **Hydration:** Client receives dehydrated cache, reuses stale data immediately (SWR pattern)
8. **Background Refetch:** TanStack Query background-refetches if data is stale
9. **User Interaction:** Pagination, filter → `useProducts()` hook updated → UI re-renders

### **Smart Search Flow (Miniapp / Web)**

1. **User opens water-map page:** Page rendered as CSR
2. **SmartSearchInput visible:** Input component from `@/features/smart-search`
3. **User uploads photo:** Feature calls backend vision API
4. **Loading state:** AI pipeline stages displayed (Photo → Vision → pgvector)
5. **Results:** Backend returns matched equipment, feature displays MatchScoreRing
6. **Click result:** View imports `@/features/smart-search` overlay, shows details

### **Checkout Flow (Spanning Multiple Entities & Features)**

1. **View:** `src/views/checkout/` composes checkout form
2. **Form state:** Feature `@/features/checkout` manages form via `useCheckoutStore`
3. **Address selection:** Feature imports `@/features/real-estate` or `@/entities/real-estate`
4. **Executor search:** Feature calls `useFilteredExecutors()` from feature API
5. **Cart sync:** Feature references `@/entities/cart` for items and pricing
6. **Submit:** Feature calls `useCheckoutSubmit()` which orchestrates multiple API calls
7. **Success:** Redirects to order detail view

### **Authentication on Miniapp (Platform-Aware)**

1. **MiniApp Layout:** `src/app/(miniapp)/layout.tsx` wraps with `PlatformProvider`
2. **PlatformProvider:** Detects platform (Telegram/MAX/Web) via `detectPlatform()`
3. **Adapter Creation:** `createPlatformAdapter(platform)` instantiates correct adapter
4. **Context Setup:** Adapter passed to React Context via `usePlatform()` hook
5. **Component Use:** Feature `@/features/auth` calls `usePlatform()` to get auth headers
6. **Telegram Example:** Adapter calls `window.Telegram.WebApp.initDataUnsafe()` to extract auth
7. **MAX Example:** Adapter calls `MAX SDK initData()` to extract auth
8. **Web Example:** Adapter uses NextAuth session from cookie

**State Management:**

- **Server State:** TanStack Query (fresh data from API, cached via query keys)
- **Client State:** Zustand + persist (auth token, cart items, theme preference)
- **Synchronization:** `refetchOnWindowFocus` by default; can override per query

## Key Abstractions

### **PlatformAdapter (Adapter Pattern)**

**Purpose:** Abstract platform differences (Telegram, MAX, Web) so business logic is platform-agnostic.

**Location:** `src/shared/lib/platform/`

**Interface:** `TPlatformAdapter` defines contract:

```typescript
type TPlatformAdapter = {
    platform: 'telegram' | 'max' | 'web';
    isReady: boolean;
    init(): Promise<void>;
    getAuthHeader(): string | null; // Platform-specific auth
    getUser(): TPlatformUser | null;
    isAuthenticated(): boolean;
    openLink?(url: string): void; // Telegram/MAX specific
    showBackButton?(onClick: () => void): () => void;
    openInvoice?(url: string): Promise<string>; // Telegram Payments
    haptic?(type: THapticType): void; // Haptic feedback on mobile
    getIsDark?(): boolean; // Platform theme
};
```

**Implementations:**

- `TelegramAdapter` — Telegram Mini App SDK
- `MaxAdapter` — MAX Mini App SDK
- `WebAdapter` — Web auth via NextAuth + JWT

**Usage in Features:**

```typescript
const { getAuthHeader, haptic } = usePlatform();
// Business logic doesn't know which platform — adapter handles it
const headers = { Authorization: getAuthHeader() };
haptic('light');
```

### **TanStack Query (Server State Management)**

**Purpose:** Cache server state, handle refetching, stale-while-revalidate pattern.

**Setup:** `src/shared/api/query-provider.tsx` wraps root

**Query Keys:** Entities define query key factories (e.g., `productKeys.products()`, `productKeys.product(id)`)

**Usage Pattern:**

```typescript
// Entity API hook
export function useProducts(groupId: string) {
    return useSuspenseQuery({
        queryKey: productKeys.products(groupId),
        queryFn: () => fetchProducts(groupId),
    });
}

// View imports and uses
const { data: products } = useProducts(groupId);
```

### **Zustand Stores (Client State)**

**Purpose:** Manage client-side state that persists across page navigations (auth, cart, UI preferences).

**Stores:**

- `useAuthStore` (`src/shared/lib/auth/`) — accessToken, refreshToken, user
- `useCartStore` (`src/entities/cart/`) — items, selections (persisted to localStorage)
- Feature stores — e.g., `useCheckoutStore`, `useWaterMapStore`

**Persist Middleware:**

```typescript
const useCartStore = create<TCartStore>()(
    persist(
        (set) => ({
            /* actions */
        }),
        { name: 'prostor-cart' }, // localStorage key
    ),
);
```

### **Zod Validation Schemas**

**Purpose:** Form validation and type inference.

**Location:** In features or shared/lib, named `*-schemas.ts`

**Usage:**

```typescript
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

type TLoginForm = z.infer<typeof loginSchema>;
```

## Entry Points

### **Web Layout: SSR/SSG/ISR**

**Location:** `src/app/(web)/`

**Triggers:** Public URLs like `/catalog`, `/product/123`, `/checkout`

**Responsibilities:**

1. Server-side data prefetch (e.g., catalog groups, product details)
2. ISR/SSG for fast static pages (catalog = ISR, revalidate 5min)
3. Render with Header/Footer layout
4. Apply authentication if needed (SSR for protected pages)

**Example:** `src/app/(web)/catalog/page.tsx`

```typescript
export const revalidate = 300;  // ISR: revalidate every 5 minutes

export default async function CatalogRoute() {
    const queryClient = getQueryClient();
    await queryClient.prefetchQuery({
        queryKey: productKeys.subGroups(MAIN_CATALOG_ID),
        queryFn: () => fetchSubGroups(MAIN_CATALOG_ID),
    });
    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CatalogPage />
        </HydrationBoundary>
    );
}
```

### **Miniapp Layout: CSR + Platform**

**Location:** `src/app/(miniapp)/`

**Triggers:** Telegram Mini App, MAX Mini App, mobile web

**Responsibilities:**

1. Wrap with `PlatformProvider` (detects Telegram/MAX/Web)
2. Initialize platform SDK (Telegram.WebApp.ready(), MAX.ready())
3. No SSR — pure CSR (minis can't SSR)

**Example:** `src/app/(miniapp)/layout.tsx`

```typescript
'use client';

export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
    return <PlatformProvider>{children}</PlatformProvider>;
}
```

### **Dashboard Layout: Role-Gated CSR**

**Location:** `src/app/(dashboard)/`

**Triggers:** Master/Curator/Manager dashboards (e.g., `/dashboard/master/orders`)

**Responsibilities:**

1. CSR-only (role checks in UI, auth guard wrapping page)
2. Sidebar navigation specific to role
3. Protected pages only accessible to logged-in masters/curators/admins

**Example:** `src/app/(dashboard)/master/page.tsx` — imports view from `src/views/dashboard`

## Architectural Constraints

- **Threading:** JavaScript is single-threaded event loop. No worker threads. All async operations via Promises/async-await.
- **Global state:** Zustand stores are global singletons created once per app. Auth tokens, cart state live here.
- **Circular imports:** Forbidden by Steiger linter. Import direction is strict: downward only (`app → views → widgets → features → entities → shared`).
- **Cross-slice dependencies:** Features don't import other features. Views can compose multiple features. Entities don't import other entities.
- **Public API enforcement:** All imports must go through `index.ts` exports. Direct imports from internal files (e.g., `@/entities/product/api/product.api.ts`) are forbidden.
- **Platform code isolation:** Telegram SDK, MAX SDK, haptic API calls only in `src/shared/lib/platform/adapters/` or layout components marked `'use client'`.
- **Server/Client split:** Root `layout.tsx` is server component. `(miniapp)` layout is client (`'use client'`). Views choose based on needs.

## Anti-Patterns

### **Importing from Internal Files**

**What happens:** Developer imports directly from `src/entities/product/api/product.api.ts` instead of through public API `@/entities/product`

**Why it's wrong:** Breaks FSD encapsulation. If entity refactors internal structure, import breaks. Exposes implementation details.

**Do this instead:** Always import through public API (`index.ts`)

```typescript
// ❌ Wrong
import { useProduct } from '@/entities/product/api/product.api';

// ✅ Correct
import { useProduct } from '@/entities/product';
```

### **Business Logic in Views**

**What happens:** View file contains Zustand store definitions, API calls, complex calculation logic instead of composition

**Why it's wrong:** Views should compose, not implement. Makes testing hard, logic scattered.

**Do this instead:** Move logic to features or entities, import into view

```typescript
// ❌ Wrong
export function ProductPage() {
    const [filters, setFilters] = useState(...);
    const products = await fetch('/api/products?...');
    // ... 50 lines of filtering logic
}

// ✅ Correct
export function ProductPage() {
    const { products, filters, setFilters } = useProductSearch();  // Feature hook
    return <ProductList products={products} />;
}
```

### **Circular Imports Between Entities**

**What happens:** `entities/product` imports from `entities/cart` or vice versa

**Why it's wrong:** Breaks layer isolation. Creates tight coupling, hard to refactor.

**Do this instead:** If entities need to work together, put composition logic in a feature

```typescript
// ❌ Wrong
// entities/product/index.ts
import { addToCart } from '@/entities/cart';

// ✅ Correct
// features/shopping/lib/add-product-to-cart.ts
import { useProduct } from '@/entities/product';
import { useCart } from '@/entities/cart';

export function useAddProductToCart() {
    const cart = useCart();
    return (product) => cart.addProduct(product);
}
```

### **Hardcoded Platform Checks Outside Adapter**

**What happens:** Feature code calls `if (typeof window.Telegram !== 'undefined')` instead of using `usePlatform()`

**Why it's wrong:** Platform logic leaks everywhere. Impossible to test. Adapter pattern defeated.

**Do this instead:** Use `usePlatform()` hook which abstracts all platform detection

```typescript
// ❌ Wrong
if (typeof window.Telegram !== 'undefined') {
    window.Telegram.WebApp.showPopup(...);
}

// ✅ Correct
const platform = usePlatform();
platform.haptic('light');  // Adapter decides implementation
```

## Error Handling

**Strategy:** Centralized error handling via `ApiError` class and React Query error boundaries.

**API Layer:**

- `apiClient()` throws `ApiError(status, statusText, data)`
- 401 Unauthorized triggers automatic token refresh
- Other errors propagate to feature/view error boundary

**Feature Layer:**

- Features catch `ApiError` and convert to user-friendly messages
- Example: `useCheckoutSubmit()` catches network errors, validation errors, displays toast

**View Layer:**

- Views wrap queries with `<QueryBoundary>` error boundary (or `<Suspense>` for error fallback)
- Shows `<PageError>` component with retry button

**Example:**

```typescript
export function CatalogPage() {
    return (
        <QueryBoundary>
            <Suspense fallback={<PageSpinner />}>
                <CatalogContent />
            </Suspense>
        </QueryBoundary>
    );
}
```

## Cross-Cutting Concerns

**Logging:**

- Development: Console only
- Production: Sentry (to be configured)

**Validation:**

- Forms: Zod schemas in features
- API responses: TypeScript types in entities
- User input: zod parse before mutation

**Authentication:**

- Web: NextAuth via JWT (httpOnly cookie)
- Miniapp: Platform SDK (Telegram.WebApp, MAX.initData)
- Token refresh: Automatic via `apiClient()` on 401

**Themeing:**

- DaisyUI themes (light/dark)
- Stored in localStorage via Zustand middleware
- Script in root `layout.tsx` prevents flash

**Safe Area (iPhone/notch):**

- `viewport-fit=cover` in meta
- CSS `env(safe-area-inset-bottom)` in sticky components

---

_Architecture analysis: 2026-07-03_
