# Codebase Structure

**Analysis Date:** 2026-07-03

## Directory Layout

```
prostor-app/
├── src/
│   ├── app/                           # Next.js App Router — routing, layouts, thin handlers
│   │   ├── layout.tsx                 # Root layout (QueryProvider, fonts, theme setup)
│   │   ├── globals.css                # Global Tailwind + custom CSS
│   │   │
│   │   ├── (web)/                     # Public web layout — SSG/ISR + SSR + Header/Footer
│   │   │   ├── layout.tsx             # Web layout (Header, Footer, CartSyncProvider, SW registration)
│   │   │   ├── catalog/page.tsx       # Catalog page — prefetch + hydrate + import CatalogPage view
│   │   │   ├── product/[id]/page.tsx  # Product detail page
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── [...more routes]
│   │   │
│   │   ├── (miniapp)/                 # Mini App layout — CSR, PlatformProvider
│   │   │   ├── layout.tsx             # CSR, wraps with PlatformProvider (Telegram/MAX detection)
│   │   │   ├── page.tsx               # Home page
│   │   │   └── [...more routes]
│   │   │
│   │   ├── (dashboard)/               # Dashboard layout — CSR, role-gated (SERVICE/CURATOR/MANAGER)
│   │   │   ├── layout.tsx             # Dashboard layout wrapper
│   │   │   ├── master/
│   │   │   │   ├── layout.tsx         # Master sidebar navigation
│   │   │   │   ├── page.tsx           # Master home
│   │   │   │   ├── orders/page.tsx    # Master orders list
│   │   │   │   ├── orders/[id]/page.tsx
│   │   │   │   ├── schedule/page.tsx
│   │   │   │   ├── area/page.tsx
│   │   │   │   └── [...more pages]
│   │   │   │
│   │   │   └── curator/
│   │   │       ├── layout.tsx         # Curator sidebar navigation
│   │   │       ├── page.tsx
│   │   │       ├── orders/page.tsx
│   │   │       ├── clients/page.tsx
│   │   │       ├── masters/page.tsx
│   │   │       └── [...more pages]
│   │   │
│   │   ├── api/                       # BFF & NextAuth endpoints
│   │   │   ├── auth/[...nextauth]/route.ts  # NextAuth routes
│   │   │   └── [...more endpoints]
│   │   │
│   │   ├── privacy-policy/page.tsx
│   │   └── personal-data-agreement/page.tsx
│   │
│   ├── views/                         # FSD Views Layer — page composition
│   │   ├── web/
│   │   │   ├── index.ts               # Exports HomePage
│   │   │   └── ui/
│   │   │       └── home-page.tsx
│   │   │
│   │   ├── catalog/
│   │   │   ├── index.ts               # Exports CatalogPage
│   │   │   └── ui/
│   │   │       ├── catalog-page.tsx   # Composes ProductList, Filters, Breadcrumbs
│   │   │       └── [...child components]
│   │   │
│   │   ├── product/
│   │   │   ├── index.ts
│   │   │   └── ui/
│   │   │       └── product-page.tsx   # Detail page: images, specs, add-to-cart button
│   │   │
│   │   ├── water-map/                 # Complex mapping page (current focus in CLAUDE.md)
│   │   │   ├── model/
│   │   │   │   ├── water-map.store.ts # Zustand: selected cell, active layers, pin placement
│   │   │   │   └── types.ts
│   │   │   ├── index.ts
│   │   │   └── ui/
│   │   │       ├── water-map-page.tsx # Main composition: canvas + overlays + toolbar
│   │   │       ├── water-map-canvas.tsx
│   │   │       ├── water-map-top-bar.tsx
│   │   │       ├── right-side-toolbar.tsx
│   │   │       ├── layer-panel.tsx
│   │   │       ├── aquifer-legend.tsx
│   │   │       ├── auto-equipment-card.tsx
│   │   │       ├── similar-fab.tsx
│   │   │       └── [...more components]
│   │   │
│   │   ├── checkout/
│   │   │   ├── index.ts
│   │   │   └── ui/
│   │   │       └── checkout-page.tsx
│   │   │
│   │   ├── orders/
│   │   │   ├── index.ts
│   │   │   └── ui/
│   │   │       └── orders-page.tsx
│   │   │
│   │   ├── order-detail/
│   │   ├── cart/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── [...more views]
│   │   └── not-found/
│   │
│   ├── widgets/                       # FSD Widgets — complex UI compositions
│   │   ├── header/
│   │   │   ├── index.ts               # Exports Header
│   │   │   └── ui/
│   │   │       ├── header.tsx         # Logo, search, auth buttons, burger menu
│   │   │       └── burger-menu/
│   │   │
│   │   ├── footer/
│   │   │   ├── index.ts
│   │   │   └── ui/
│   │   │       └── footer.tsx
│   │   │
│   │   ├── chat-window/               # Complex chat UI with messages, typing, etc.
│   │   ├── order-chat-view/
│   │   ├── master-profile/
│   │   ├── curator-sidebar/           # Curator-only navigation sidebar
│   │   └── .gitkeep
│   │
│   ├── features/                      # FSD Features — business logic spanning entities
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   │   └── auth-api.ts        # TanStack Query: webLogin, webRegister, fetchCurrentUser
│   │   │   ├── lib/
│   │   │   │   ├── auth-schemas.ts    # Zod: loginSchema, registerSchema
│   │   │   │   └── use-logout.ts      # Logout hook
│   │   │   ├── index.ts               # Exports: auth hooks, API functions, schemas
│   │   │   └── .gitkeep
│   │   │
│   │   ├── smart-search/              # AI vision search (current focus in CLAUDE.md)
│   │   │   ├── api/
│   │   │   │   ├── smart-search.api.ts # POST /vision, GET /equipment-suggestions
│   │   │   │   └── use-smart-search.ts # TanStack Query hook
│   │   │   ├── model/
│   │   │   │   ├── smart-search.store.ts # Zustand: query, results, loading state
│   │   │   │   ├── throttle-tracker.ts # Rate limit (60s rolling window, 3 requests)
│   │   │   │   └── types.ts
│   │   │   ├── ui/
│   │   │   │   ├── smart-search-input/
│   │   │   │   │   └── smart-search-input.tsx # Input + camera button + chip suggestions
│   │   │   │   ├── smart-search-overlay/
│   │   │   │   │   └── smart-search-overlay.tsx # Results overlay with vision badge
│   │   │   │   ├── recent-searches-list/
│   │   │   │   ├── chip-suggestions/
│   │   │   │   ├── match-score-ring/
│   │   │   │   └── ai-pipeline-stages/
│   │   │   ├── index.ts
│   │   │   └── .gitkeep
│   │   │
│   │   ├── checkout/
│   │   │   ├── api/
│   │   │   │   └── executor.api.ts    # GET /executors/filter
│   │   │   ├── model/
│   │   │   │   ├── checkout.store.ts  # Zustand: address, executor, schedule, delivery
│   │   │   │   └── types.ts
│   │   │   ├── lib/
│   │   │   │   ├── use-checkout-submit.ts # Multi-step submit logic
│   │   │   │   ├── use-checkout-executors.ts # Filter & search executors
│   │   │   │   ├── use-checkout-page-state.ts # Derived state for view
│   │   │   │   └── [more utilities]
│   │   │   ├── ui/
│   │   │   │   ├── checkout-address-selector/
│   │   │   │   ├── pickup-store-selector/
│   │   │   │   ├── order-schedule-dialog/
│   │   │   │   ├── executor-preview/
│   │   │   │   ├── checkout-total/
│   │   │   │   └── [...more components]
│   │   │   ├── index.ts
│   │   │   └── .gitkeep
│   │   │
│   │   ├── cart/                      # Cart syncing with backend after login
│   │   │   ├── model/
│   │   │   │   └── cart-sync.store.ts # Zustand: sync state, pending items
│   │   │   ├── lib/
│   │   │   │   └── use-cart-synchronization.ts
│   │   │   ├── ui/
│   │   │   │   └── cart-sync-provider.tsx # Provider that syncs cart on login
│   │   │   ├── index.ts
│   │   │   └── .gitkeep
│   │   │
│   │   ├── real-estate/              # Real estate property selection
│   │   ├── orders/                   # Orders list, filtering, tracking
│   │   ├── push-notifications/       # SW registration, push subscriptions
│   │   ├── product-search/           # Search modal (separate from smart-search)
│   │   ├── address-search/           # Geolocation + autocomplete
│   │   ├── master-access-gate/       # Master role gate
│   │   ├── curator-access-gate/      # Curator role gate
│   │   │
│   │   ├── master-public/            # Master public profile, ratings
│   │   ├── master-settings/          # Master settings pages (profile, schedule, location, vehicle, etc.)
│   │   │   ├── master-qualification/
│   │   │   ├── master-work-days/
│   │   │   ├── master-location/
│   │   │   ├── master-vehicle/
│   │   │   ├── master-service-area/
│   │   │   └── [...more settings]
│   │   │
│   │   ├── catalog/                  # Catalog navigation & filtering
│   │   ├── service-settings/         # Service configuration
│   │   ├── installed-equipment/      # Equipment management
│   │   └── .gitkeep
│   │
│   ├── entities/                      # FSD Entities — domain objects
│   │   ├── product/
│   │   │   ├── api/
│   │   │   │   ├── product.api.ts    # TanStack Query: useProducts, useProduct, useProductSearch
│   │   │   │   └── use-product-thumbnails.ts
│   │   │   ├── index.ts              # Exports: hooks, types
│   │   │   └── .gitkeep
│   │   │
│   │   ├── cart/
│   │   │   ├── api/
│   │   │   │   └── cart.api.ts       # POST /cart endpoints
│   │   │   ├── model/
│   │   │   │   └── cart.store.ts     # Zustand: items, selection state (persisted to localStorage)
│   │   │   ├── lib/
│   │   │   │   ├── calculate-selected-totals.ts
│   │   │   │   ├── cart-mappers.ts   # Convert API response to store format
│   │   │   │   └── use-cart-hydrated.ts # Ensure store hydrated before render
│   │   │   ├── ui/
│   │   │   │   ├── cart-item/        # Single product in cart
│   │   │   │   ├── cart-item-list/
│   │   │   │   ├── cart-service-item/
│   │   │   │   ├── cart-service-card/
│   │   │   │   └── cart-empty/
│   │   │   ├── index.ts
│   │   │   └── .gitkeep
│   │   │
│   │   ├── order/
│   │   │   ├── api/
│   │   │   │   └── order.api.ts      # GET /orders, GET /orders/:id
│   │   │   ├── ui/
│   │   │   │   └── order-card/       # Displays single order summary
│   │   │   ├── index.ts
│   │   │   └── .gitkeep
│   │   │
│   │   ├── user/
│   │   │   ├── api/
│   │   │   ├── ui/
│   │   │   └── index.ts
│   │   │
│   │   ├── real-estate/              # Properties, addresses, B2B objects
│   │   │   ├── api/
│   │   │   └── ui/
│   │   │
│   │   ├── water-analysis/           # Water quality data
│   │   ├── chat/
│   │   ├── delivery/
│   │   ├── installed-equipment/      # Installed equipment on property
│   │   ├── moy-sklad-store/          # МойСклад integration
│   │   ├── service-zone/
│   │   ├── account-service/
│   │   ├── order-feedback/
│   │   ├── privacy-policy/           # Entity for rendering privacy policy
│   │   ├── personal-data-agreement/
│   │   └── .gitkeep
│   │
│   ├── shared/                        # FSD Shared — utilities, platform, types
│   │   ├── api/
│   │   │   ├── api-client.ts         # fetch wrapper with auth + token refresh
│   │   │   ├── query-client.ts       # TanStack Query config
│   │   │   ├── query-provider.tsx    # React Context provider for QueryClient
│   │   │   ├── slovo-api-client.ts   # Separate client for water-analysis API
│   │   │   ├── use-api.ts
│   │   │   ├── index.ts
│   │   │   └── *.test.ts             # Unit tests for API layer
│   │   │
│   │   ├── lib/
│   │   │   ├── platform/             # **Adapter Pattern** — platform abstraction
│   │   │   │   ├── types.ts          # TPlatformAdapter interface
│   │   │   │   ├── factory.ts        # createPlatformAdapter() factory
│   │   │   │   ├── platform-provider.tsx # React Context provider
│   │   │   │   ├── adapters/
│   │   │   │   │   ├── telegram-adapter.ts  # Telegram Mini App SDK
│   │   │   │   │   ├── max-adapter.ts       # MAX Mini App SDK
│   │   │   │   │   └── web-adapter.ts       # Web auth via NextAuth + JWT
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── use-platform.ts      # Access current platform adapter
│   │   │   │   │   └── use-auth.ts          # Platform-aware auth hook
│   │   │   │   ├── utils/
│   │   │   │   │   ├── detect-platform.ts   # Determine if Telegram/MAX/Web
│   │   │   │   │   └── mock-telegram-env.ts # Dev mocking
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── auth/                 # Global auth store
│   │   │   │   ├── auth-store.ts     # Zustand: accessToken, refreshToken, user
│   │   │   │   ├── map-user.ts       # User data transformer
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── hooks/                # Generic React hooks
│   │   │   │   ├── use-media-query.ts
│   │   │   │   ├── use-daisy-theme.ts
│   │   │   │   └── [...more hooks]
│   │   │   │
│   │   │   ├── format/               # String formatters
│   │   │   │   ├── format-price.ts
│   │   │   │   ├── format-date.ts
│   │   │   │   └── [...]
│   │   │   │
│   │   │   ├── product/              # Product-specific utilities
│   │   │   ├── cn.ts                 # classnames utility
│   │   │   ├── retry.ts              # Retry helper
│   │   │   ├── extract-error-message.ts
│   │   │   ├── get-safe-redirect.ts
│   │   │   ├── build-search-params.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── model/                    # Domain types — single source of truth
│   │   │   ├── t-product.ts          # type TProduct
│   │   │   ├── t-order.ts
│   │   │   ├── t-user.ts
│   │   │   ├── t-cart-item.ts
│   │   │   ├── t-real-estate.ts
│   │   │   ├── t-group.ts            # Product group
│   │   │   ├── t-service.ts
│   │   │   ├── t-work-day.ts
│   │   │   ├── t-installed-equipment.ts
│   │   │   ├── t-order-feedback.ts
│   │   │   ├── e-service-category.ts # enum
│   │   │   ├── [...more types]
│   │   │   └── index.ts              # Re-exports all types
│   │   │
│   │   ├── ui/                       # Shared UI components
│   │   │   ├── base/                 # Base components (Button, Input, etc. from DaisyUI)
│   │   │   ├── icons/                # SVG icon components
│   │   │   │   ├── water-drop.tsx
│   │   │   │   ├── article-dots.tsx
│   │   │   │   └── [...more icons]
│   │   │   │
│   │   │   ├── input-field/          # Wrapped form input
│   │   │   ├── button/               # Wrapped button
│   │   │   ├── icon-button/
│   │   │   ├── modal/                # Modal wrapper
│   │   │   ├── bottom-sheet-modal/   # Mobile bottom sheet
│   │   │   ├── compact-modal/        # Compact modal variant
│   │   │   ├── confirm-dialog/       # Confirmation dialog
│   │   │   │
│   │   │   ├── card-wrapper/         # Card container
│   │   │   ├── card-image/           # Image in card
│   │   │   ├── cart-card-wrapper/    # Cart item card
│   │   │   ├── card-badge/           # Badge overlay
│   │   │   │
│   │   │   ├── page-container/       # Page layout wrapper (max-w, padding)
│   │   │   ├── page-title/           # Page heading + breadcrumbs
│   │   │   ├── page-spinner/         # Full-page loading spinner
│   │   │   ├── page-error/           # Full-page error state
│   │   │   ├── query-boundary/       # Error boundary for TanStack Query
│   │   │   │
│   │   │   ├── breadcrumbs/
│   │   │   ├── counter/              # +/- quantity selector
│   │   │   ├── star-rating/
│   │   │   ├── range-slider/
│   │   │   ├── infinite-list/        # Scroll-to-load
│   │   │   ├── sticky-total-bar/     # Sticky price/total footer
│   │   │   │
│   │   │   ├── map-view/             # MapLibre GL wrapper
│   │   │   ├── form-field/           # Form wrapper
│   │   │   ├── form-card/
│   │   │   ├── section-label/
│   │   │   ├── product-tab-switcher/
│   │   │   ├── legal-document-meta/
│   │   │   ├── legal-document-modal/
│   │   │   ├── legal-markdown/
│   │   │   ├── theme-toggle/
│   │   │   ├── dashboard-back-header/ # Master/Curator dashboard header with back button
│   │   │   ├── catalog-info-block/
│   │   │   └── .gitkeep
│   │   │
│   │   ├── config/                   # App constants
│   │   │   ├── app-name.ts           # const APP_NAME = 'PROSTOR'
│   │   │   ├── api-url.ts            # const API_URL = 'https://api.prostor...'
│   │   │   └── index.ts
│   │   │
│   │   └── styles/
│   │       └── globals.css           # Linked from root layout
│   │
│   └── test/
│       ├── setup.ts                  # Vitest setup (MSW, globals)
│       └── mocks/                    # MSW handlers, fixtures
│
├── public/                            # Static assets
│   ├── icon-192.png
│   ├── apple-touch-icon.png
│   ├── manifest.json                 # PWA manifest
│   └── [...more assets]
│
├── .planning/
│   ├── codebase/
│   │   ├── ARCHITECTURE.md            # This file
│   │   └── STRUCTURE.md
│   └── phases/
│       └── [phase-related files]
│
├── docs/
│   ├── features/
│   │   └── smart-search-integration.md # Current focus (Phase 1)
│   ├── references/
│   ├── strategy/
│   ├── backend/
│   ├── workflow/
│   └── feedback/
│
├── e2e/                               # Playwright E2E tests
├── .env.example                       # Environment template
├── .env.local                         # Local env (git-ignored)
├── eslintrc.json                      # ESLint config (flat config)
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── package.json
└── package-lock.json
```

## Directory Purposes

**`src/app`** (Next.js App Router)

- Entry point for all routes
- Thin page.tsx files that prefetch + hydrate + import view
- Layout groups define rendering strategy: (web) = SSG/ISR+SSR, (miniapp) = CSR, (dashboard) = CSR
- API routes for BFF endpoints

**`src/views`** (Page Composition)

- FSD 2.1 replacement for `pages` (avoids Next.js Pages Router conflict)
- Each page is composed of widgets, features, and entities
- Views don't implement business logic — they import and compose

**`src/widgets`** (Complex UI)

- Large, reusable UI compositions (Header, Footer, sidebars, modals)
- May be used across multiple pages/layout groups
- Can have their own state (Zustand)

**`src/features`** (Business Logic)

- Features span multiple entities (e.g., Checkout uses Order + Cart + RealEstate + Payment)
- Contain business logic, validation schemas (Zod), hooks, stores
- Exported through public API (index.ts)

**`src/entities`** (Domain Objects)

- Core business domain (Product, Order, User, Cart, etc.)
- Each entity owns: API (TanStack Query hooks), UI components, business logic
- Types defined locally, reexported from `shared/model`
- Entities don't import other entities

**`src/shared/api`** (Server State)

- `apiClient()` — fetch wrapper with auth + token refresh
- TanStack Query setup and hooks
- Slovo (water-analysis) API client

**`src/shared/lib/platform`** (Adapter Pattern)

- Platform abstraction for Telegram/MAX/Web
- `TPlatformAdapter` interface
- Concrete adapters and factory
- Hooks: `usePlatform()`, `usePlatformAuth()`

**`src/shared/model`** (Types)

- Single source of truth for domain types
- Entities and features import from here
- Types: TProduct, TOrder, TUser, TCart, TService, etc.

**`src/shared/ui`** (Components)

- Reusable UI components (Input, Button, Modal, Card, etc.)
- Form components, layout containers, icons
- No business logic — pure presentation

## Key File Locations

### **Entry Points**

| Route               | Page File                             | View File              | Purpose                      |
| ------------------- | ------------------------------------- | ---------------------- | ---------------------------- |
| `/`                 | `src/app/(web)/page.tsx`              | `src/views/web/`       | Home page                    |
| `/catalog`          | `src/app/(web)/catalog/page.tsx`      | `src/views/catalog/`   | Catalog (SSG + ISR)          |
| `/product/[id]`     | `src/app/(web)/product/[id]/page.tsx` | `src/views/product/`   | Product detail               |
| `/cart`             | `src/app/(web)/cart/page.tsx`         | `src/views/cart/`      | Cart view                    |
| `/checkout`         | `src/app/(web)/checkout/page.tsx`     | `src/views/checkout/`  | Checkout form                |
| `/water`            | `src/app/(miniapp)/page.tsx`          | `src/views/water-map/` | Water analysis map (miniapp) |
| `/dashboard/master` | `src/app/(dashboard)/master/page.tsx` | `src/views/dashboard/` | Master dashboard             |

### **Configuration**

| File                                | Purpose                                          |
| ----------------------------------- | ------------------------------------------------ |
| `src/shared/config/`                | Constants: API_URL, APP_NAME, MAIN_CATALOG_ID    |
| `src/shared/api/query-client.ts`    | TanStack Query config: staleTime, retry          |
| `src/shared/lib/auth/auth-store.ts` | Global auth store: tokens, user                  |
| `next.config.ts`                    | Next.js config (output: 'standalone' for Docker) |
| `tailwind.config.ts`                | Tailwind + DaisyUI theme                         |
| `tsconfig.json`                     | TypeScript config + path aliases (@/)            |
| `eslintrc.json`                     | ESLint flat config + Steiger FSD linter          |

### **Core Business Logic**

| Feature                | Files                                                                    |
| ---------------------- | ------------------------------------------------------------------------ |
| **Auth**               | `src/features/auth/`, `src/shared/lib/auth/`, `src/shared/lib/platform/` |
| **Cart**               | `src/entities/cart/`, `src/features/cart/`                               |
| **Checkout**           | `src/features/checkout/`                                                 |
| **Product Catalog**    | `src/entities/product/`, `src/features/catalog/`                         |
| **Smart Search**       | `src/features/smart-search/` (current focus)                             |
| **Water Analysis Map** | `src/views/water-map/`, `src/entities/water-analysis/`                   |
| **Orders**             | `src/entities/order/`, `src/features/orders/`                            |

### **Testing**

| Type                | Location                                          |
| ------------------- | ------------------------------------------------- |
| **Unit Tests**      | `src/**/*.test.ts` — co-located with source files |
| **Component Tests** | `src/**/*.test.tsx` — same directory as component |
| **E2E Tests**       | `e2e/` — Playwright tests                         |
| **Test Setup**      | `src/test/setup.ts` — Vitest config, MSW          |
| **Fixtures/Mocks**  | `src/test/mocks/` — MSW handlers, test data       |

## Naming Conventions

### **Files**

| What           | Pattern                                    | Example                                                                  |
| -------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| **Component**  | `kebab-case.tsx` (component folder + file) | `src/features/smart-search/ui/smart-search-input/smart-search-input.tsx` |
| **Hook**       | `use-kebab-case.ts`                        | `src/shared/lib/hooks/use-media-query.ts`                                |
| **Utility**    | `kebab-case.ts`                            | `src/shared/lib/format/format-price.ts`                                  |
| **Type**       | `t-kebab-case.ts` → `type TName`           | `src/shared/model/t-product.ts` → `type TProduct`                        |
| **Enum**       | `e-kebab-case.ts` → `enum EName`           | `src/shared/model/e-service-category.ts` → `enum EServiceCategory`       |
| **API**        | `kebab-case.api.ts`                        | `src/entities/product/api/product.api.ts`                                |
| **Store**      | `kebab-case.store.ts`                      | `src/entities/cart/model/cart.store.ts`                                  |
| **Test**       | `kebab-case.test.ts(x)`                    | `src/entities/cart/model/cart.store.test.ts`                             |
| **Public API** | `index.ts`                                 | `src/entities/product/index.ts`                                          |

### **Directories**

| What                 | Pattern       | Example                                                             |
| -------------------- | ------------- | ------------------------------------------------------------------- |
| **FSD Slice**        | `kebab-case/` | `src/features/smart-search/`                                        |
| **Subdirectory**     | `kebab-case/` | `src/features/smart-search/model/`, `src/features/smart-search/ui/` |
| **Component Folder** | `kebab-case/` | `src/features/smart-search/ui/smart-search-input/`                  |

### **Code**

| What          | Pattern          | Example                               |
| ------------- | ---------------- | ------------------------------------- |
| **Type**      | `T` prefix       | `type TProduct = { ... }`             |
| **Enum**      | `E` prefix       | `enum EOrderStatus { ... }`           |
| **Hook**      | `use` prefix     | `function useCart() { ... }`          |
| **Component** | PascalCase       | `function SmartSearchInput() { ... }` |
| **Function**  | camelCase        | `function calculateTotal() { ... }`   |
| **Variable**  | camelCase        | `const productId = '123'`             |
| **Constant**  | UPPER_SNAKE_CASE | `const MAX_RETRY_COUNT = 3`           |

## Where to Add New Code

### **New Feature**

A feature is cross-cutting business logic (e.g., new payment method, new form, new filter).

**Create:**

```
src/features/[feature-name]/
├── api/
│   └── [feature].api.ts          # TanStack Query hooks
├── model/
│   ├── [feature].store.ts        # Zustand store (if needed)
│   ├── types.ts                  # Local types
│   └── schemas.ts                # Zod schemas
├── lib/
│   ├── [utility].ts              # Business logic functions
│   └── use-[hook].ts             # Feature-specific hooks
├── ui/
│   ├── [component].tsx           # Feature components
│   └── [component]/              # Complex component with subfolder
│       ├── [component].tsx
│       └── [...children]
├── index.ts                      # Public API (export everything)
└── .gitkeep
```

**Export from `index.ts`:**

```typescript
export { useMyFeature } from './api/my-feature.api';
export { useMyFeatureStore } from './model/my-feature.store';
export type { TMyFeatureForm } from './model/schemas';
export { MyFeatureComponent } from './ui/my-feature-component';
```

**Import in views/widgets:**

```typescript
import { useMyFeature, MyFeatureComponent } from '@/features/my-feature';
```

### **New Entity (Domain Object)**

An entity is a core business domain (Product, Order, Payment, etc.).

**Create:**

```
src/entities/[entity-name]/
├── api/
│   └── [entity].api.ts           # TanStack Query: useEntity, useEntities, fetch queries
├── model/
│   ├── [entity].store.ts         # Zustand (if entity has complex state)
│   └── types.ts                  # Local types (reexported from shared/model)
├── lib/
│   ├── [mapper].ts               # Data transformers
│   └── [calculator].ts           # Business logic
├── ui/
│   ├── [entity]-card.tsx         # Display component
│   ├── [entity]-item/
│   └── [entity]-form.tsx         # Input component
├── index.ts                      # Public API
└── .gitkeep
```

**Also add type to shared/model:**

```
src/shared/model/t-[entity-name].ts
```

### **New Page/View**

A page composes widgets, features, and entities.

**For web route `/my-page`:**

1. Create `src/app/(web)/my-page/page.tsx` (thin wrapper, SSR/SSG handler)
2. Create `src/views/my-page/` with composition
3. Page prefetches data in app router, imports and renders view

```typescript
// src/app/(web)/my-page/page.tsx
export const revalidate = 300;  // ISR

export default async function MyPageRoute() {
    const queryClient = getQueryClient();
    await queryClient.prefetchQuery({ /* ... */ });
    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <MyPage />
        </HydrationBoundary>
    );
}
```

```typescript
// src/views/my-page/ui/my-page.tsx
'use client';

export function MyPage() {
    return (
        <PageContainer>
            <PageTitle>My Page</PageTitle>
            <MyFeatureComponent />
            <EntityCard />
        </PageContainer>
    );
}
```

### **New Shared UI Component**

A reusable component used across multiple slices.

**Create:**

```
src/shared/ui/[component-name]/
├── [component-name].tsx
├── [component-name].test.tsx
└── index.ts                      # export { MyComponent }
```

### **New Utility / Helper**

Small utility functions used in multiple places.

**Location:**

- Format functions → `src/shared/lib/format/` (e.g., `format-price.ts`)
- Generic hooks → `src/shared/lib/hooks/` (e.g., `use-media-query.ts`)
- Entity-specific logic → within entity `lib/` (e.g., `src/entities/cart/lib/calculate-totals.ts`)

## Special Directories

### **`src/test/`**

**Purpose:** Vitest setup, MSW configuration, test fixtures

**Files:**

- `setup.ts` — Vitest config, MSW setup, global test utilities
- `mocks/` — MSW handlers for API endpoints
- Fixtures — reusable test data

### **`.planning/codebase/`**

**Purpose:** Code analysis documents (ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md)

**Not generated:** These are hand-written by gsd-map-codebase agent

### **`docs/`**

**Purpose:** Project documentation

**Subdirectories:**

- `features/` — Feature specifications (e.g., smart-search-integration.md)
- `strategy/` — Strategic docs (TECH-STACK.md, ROADMAP.md)
- `workflow/` — Team workflow (GIT-FLOW.md, SUBAGENTS.md)
- `references/` — Backend and legacy frontend references
- `feedback/` — Ongoing discussion threads

---

_Structure analysis: 2026-07-03_
