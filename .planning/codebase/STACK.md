# Technology Stack

**Analysis Date:** 2026-07-03

## Languages

**Primary:**

- TypeScript 5.x - Main language for all source code, strict mode enabled
- JavaScript (Node.js) - Runtime language, target ES2017

**Compilation:**

- Target: ES2017 (via `tsconfig.json`)
- Module system: ESNext
- JSX: React JSX

## Runtime

**Environment:**

- Node.js 22.16-slim (from Dockerfile ARG NODE_IMAGE)

**Package Manager:**

- npm (package-lock.json present)
- Lockfile: `package-lock.json` (committed)

## Frameworks

**Core:**

- Next.js 16.1.6 - App Router framework with React 19 integration
    - Output: `standalone` (optimized for Docker)
    - React Compiler enabled
    - Rewrites for `/api/*` and `/smart-search/*` endpoints

**UI & Styling:**

- React 19.2.3 - UI library (no hooks deprecation; relies on React Compiler)
- Tailwind CSS 4 - Utility-first CSS framework
    - PostCSS plugin: `@tailwindcss/postcss`
    - Typography plugin: `@tailwindcss/typography`
- DaisyUI 5.5.19 - Tailwind component library (custom light theme with oklch colors)

**Forms & Validation:**

- React Hook Form 7.71.2 - Form state management
- Zod 4.3.6 - Schema validation and TypeScript inference
- @hookform/resolvers 5.2.2 - Zod integration with React Hook Form

**Data Fetching & State:**

- TanStack React Query 5.90.21 - API caching, synchronization, background refetching
    - Stale time: 60s (default)
    - Retry: 1 attempt (default)
- Zustand 5.0.11 - Client-side state management (auth, cart, search)

**Maps & Geospatial:**

- MapLibre GL 5.20.1 - Open-source WebGL map renderer
- react-map-gl 8.1.0 - React wrapper for MapLibre GL
    - Used via `react-map-gl/maplibre` export
- @turf/turf 7.3.4 - Geospatial analysis utilities

**UI Components & Effects:**

- @headlessui/react 2.2.9 - Headless UI primitives
- @heroicons/react 2.2.0 - Heroicons SVG icons (24px outline set)
- react-toastify 11.0.5 - Toast notifications
- react-datepicker 9.1.0 - Date picker component
- react-error-boundary 6.1.1 - Error boundary component
- Swiper 12.1.2 - Touch carousel/slider
- react-virtuoso 4.18.3 - Virtual scrolling for large lists
- react-zoom-pan-pinch 3.7.0 - Image zoom/pan/pinch interactions
- react-markdown 10.1.0 - Markdown to React component rendering
- react-intersection-observer 10.0.3 - Intersection Observer hook
- broad-infinite-list 1.4.1 - Infinite list virtualization
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 3.5.0 - Merge Tailwind classes safely
- aria-query 5.3.2 - Accessible component queries

**Platform Adapters:**

- @tma.js/sdk-react 3.0.16 - Telegram Mini App SDK (initData, haptics, theme, back button, invoice)

## Testing

**Unit Testing:**

- Vitest 3.2.4 - Fast unit test runner (default config, uses happy-dom)
    - Coverage: `NODE_OPTIONS='--experimental-require-module' vitest run --coverage`
    - Test file discovery: `*.test.ts`, `*.test.tsx`
    - 94 test files in `src/`

**Component Testing:**

- @testing-library/react 16.3.2 - React component testing utilities
- @testing-library/jest-dom 6.9.1 - DOM matchers for Vitest
- @testing-library/user-event 14.6.1 - User interaction simulation

**API Mocking:**

- MSW (Mock Service Worker) 2.12.11 - Intercepts fetch requests (used in tests)

**E2E Testing:**

- @playwright/test 1.58.2 - Browser automation (installed but no e2e tests in repo)

**Test Environment:**

- happy-dom 20.8.4 - Lightweight DOM implementation (used by Vitest)

## Build Tools & Dev Infrastructure

**Linting & Code Quality:**

- ESLint 9.x (flat config) - JavaScript/TypeScript linting
    - Config: `eslint.config.mjs`
    - Plugins:
        - `eslint-config-next/core-web-vitals`
        - `eslint-config-next/typescript`
        - `@typescript-eslint/eslint-plugin`
    - Rules: `@typescript-eslint/no-explicit-any: 'error'`
    - Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

**FSD Architecture Validation:**

- Steiger 0.5.11 - Feature-Sliced Design linter
    - Plugin: `@feature-sliced/steiger-plugin`
    - Config: `./src` (validates structure, imports, public API)

**Code Formatting:**

- Prettier 3.8.1 - Code formatter
    - Config: `.prettierrc`
    - Settings:
        - Indentation: 4 spaces (no tabs)
        - Semi-colons: true
        - Single quotes: true
        - Trailing comma: all
        - Print width: 100 characters
        - Arrow parens: always

**Git Hooks:**

- Husky 9.1.7 - Git hook manager
    - Hook: `prepare` (runs on install)
- lint-staged 16.3.3 - Staged file linting
    - `*.{ts,tsx}`: Prettier → ESLint --fix
    - `*.{json,css,md}`: Prettier --write

**Build Compiler:**

- Babel Plugin React Compiler 1.0.0 - Auto-memoization (removes manual useMemo/useCallback)

## Configuration Files

**TypeScript:**

- `tsconfig.json`
    - Target: ES2017
    - Lib: dom, dom.iterable, esnext
    - Strict: true
    - Module: esnext
    - Path aliases: `@/*` → `./src/*`
    - Plugins: Next.js TypeScript plugin

**Next.js:**

- `next.config.ts`
    - Output: standalone (for Docker)
    - React Compiler: enabled
    - Rewrites: `/api/*` → INTERNAL_API_URL, `/smart-search/*` → INTERNAL_SLOVO_API_URL
    - Image remotePatterns: Telegram CDN, t.me
    - Turbopack: enabled

**Code Style:**

- `.prettierrc` - Prettier config (4 spaces, 100 char width)
- `eslint.config.mjs` - ESLint flat config

## Platform Requirements

**Development:**

- Node.js 22.16+
- npm (lockfile present)
- Port 3050 (dev server via `npm run dev`)
- Port 3050 (HTTPS: `npm run dev:https`)

**Production:**

- Docker (multi-stage build: deps → builder → runner)
- Node.js 22.16-slim container image
- Port 3000 (Next.js server)
- Network: `crm_network_prod` (Docker Compose)
- Health check: HTTP GET to `/`

**Deployment Target:**

- Docker container (standalone Next.js)
- Docker Compose orchestration with crm-back and slovo-api services

## Environment Variables (Build-time)

**Client-side (NEXT*PUBLIC*\* inlined at build):**

- `NEXT_PUBLIC_API_URL` - Main API endpoint (default: `http://localhost:3000`)
- `NEXT_PUBLIC_SLOVO_API_URL` - Water analysis API (default: `http://localhost:3101`)
- `NEXT_PUBLIC_S3_PUBLIC_URL` - S3 storage base URL (default: empty)
- `NEXT_PUBLIC_SALE_PRICES` - Sale prices label (default: `Приложение`)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Web Push VAPID public key (default: empty)
- `NEXT_PUBLIC_COMMISSION_PERCENTS` - Commission % (default: 35)
- `NEXT_PUBLIC_SMART_SEARCH_MOCK` - Mock smart search API flag (default: 0)

**Server-side (build-time):**

- `BUILD_API_URL` - API URL at build time (overrides NEXT_PUBLIC_API_URL)
- `BUILD_SLOVO_API_URL` - Slovo API URL at build time
- `INTERNAL_API_URL` - Internal API URL (Docker, default: `http://crm-back:3000`)
- `INTERNAL_SLOVO_API_URL` - Internal Slovo API (Docker, default: `http://slovo-api:3101`)
- `NODE_ENV` - Environment (production in Docker)

## Security & Quality

**No Explicit Any:**

- ESLint rule: `@typescript-eslint/no-explicit-any: 'error'`
- All code must use `unknown` or proper types

**Component Defaults:**

- Server components by default (no `'use client'` unless needed)
- Client-side interactions: mark with `'use client'`

**CSS Customization:**

- Tailwind 4 with DaisyUI 5 (kustom oklch colors for light theme)
- Arbitrary values allowed (e.g., `leading-[110%]`)
- Custom CSS utilities: `.scrollbar-hidden`, `.gradient-text`, `.gradient-bg`, `.gradient-bg-grey`
- Safe area: `env(safe-area-inset-bottom)` for notch-safe layouts

---

_Stack analysis: 2026-07-03_
