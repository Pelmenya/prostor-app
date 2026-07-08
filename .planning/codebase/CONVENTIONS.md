# Coding Conventions

**Analysis Date:** 2026-07-03

## Naming Patterns

**Files:**

- Components: `kebab-case/kebab-case.tsx` (e.g., `page-spinner/page-spinner.tsx`, `form-field/form-field.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-cart-hydrated.ts`, `use-product-search.ts`)
- Utilities/helpers: `kebab-case.ts` (e.g., `extract-error-message.ts`, `build-search-params.ts`)
- API/Query: `kebab-case.api.ts` (e.g., `product.api.ts`, `privacy-policy.api.ts`)
- Zustand store: `kebab-case.store.ts` (e.g., `cart.store.ts`, `smart-search.store.ts`)
- Tests: `kebab-case.test.ts(x)` (e.g., `cart.store.test.ts`, `page-spinner.test.tsx`)
- Types: `t-kebab-case.ts` (e.g., `t-product.ts`, `t-cart-item.ts`)
- Enums: `e-kebab-case.ts` (e.g., `e-message-type.ts`, `e-service-category.ts`)

**Functions:**

- camelCase: `extractErrorMessage()`, `buildSearchParams()`, `selectTotalPrice()`
- Hooks: `useCartHydrated()`, `useProductSearchPaginated()`, `useAuthStore()`

**Variables:**

- camelCase: `mockProduct`, `queryClient`, `requestHeaders`
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_ATTEMPTS`, `BASE_URL`)

**Types:**

- Prefix with `T`: `type TProduct`, `type TCartItem`, `type TGroup`
- PascalCase after prefix: `type TApiClientOptions`, `type TPaginatedProducts`

**Enums:**

- Prefix with `E`: `enum EMessageType`, `enum EServiceCategory`, `enum EUserRole`
- PascalCase after prefix: `EServiceCategory.MONTAZH`, `EMessageType.TEXT`

**Components:**

- PascalCase: `PageSpinner`, `LoginPage`, `FormField`

## Code Style

**Formatting:**

- **Indentation:** 4 spaces (tabs forbidden)
- **Line length:** 100 characters (Prettier printWidth)
- **Trailing commas:** all (in objects, arrays, function parameters)
- **Semicolons:** required (semi: true)
- **Quotes:** single quotes (singleQuote: true)
- **Arrow functions:** always include parentheses (arrowParens: always)

Run Prettier on save: `prettier --write`

**Linting:**

- **Tool:** ESLint 9 with flat config
- **Key config:** `eslint.config.mjs`
- **Key rule:** `@typescript-eslint/no-explicit-any: 'error'` — no `any` type, use `unknown` or generics instead
- **Next.js plugins:** eslint-config-next core-web-vitals and typescript
- **Run:** `npm run lint` or through pre-commit hook

**Code Organization:**

- **React 19:** Do NOT use `useMemo`, `useCallback`, `React.memo` — React Compiler handles optimization
- **Server components by default:** Components are server-side unless `'use client'` is present
- **'use client' only when needed:** For interactivity, hooks, event handlers, or state management
- **Import @ alias:** Use `@/` for all local imports (configured in `tsconfig.json` and `vitest.config.ts`)

## Import Organization

**Order:**

1. React/Next.js imports: `import { useState } from 'react'`, `import { useRouter } from 'next/navigation'`
2. Third-party libraries: `import { useQuery } from '@tanstack/react-query'`, `import { clsx } from 'clsx'`
3. Local imports using `@/`: `import { useCartStore } from '@/entities/cart'`, `import { cn } from '@/shared/lib'`
4. Type imports: `import type { TProduct } from '@/shared/model'`

**Path Aliases:**

- `@/` → `src/` (configured in `tsconfig.json`)
- Always use public API: import from slices via `index.ts`, never from internal paths
    - ✅ `import { useCartStore } from '@/entities/cart'`
    - ❌ `import { useCartStore } from '@/entities/cart/model/cart.store'`

**Example:**

```typescript
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import type { TProduct } from '@/shared/model';
import { cn } from '@/shared/lib';
import { useProductSearch } from '@/features/product-search';
```

## Error Handling

**Custom Error Class:**

```typescript
export class ApiError extends Error {
    constructor(
        public status: number,
        public statusText: string,
        public data: unknown,
    ) {
        super(`API Error: ${status} ${statusText}`);
        this.name = 'ApiError';
    }
}
```

**Pattern — Extract Error Message:**
Function `extractErrorMessage(data: unknown, fallback: string): string` handles NestJS validation responses:

- Extracts `message: string` directly
- Handles `message: string[]` by taking first element
- Falls back to provided fallback string if not found

Location: `src/shared/lib/extract-error-message.ts`

**Pattern — Retry with Exponential Backoff:**

```typescript
export async function retryAsync<T>(fn: () => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
        try {
            return await fn();
        } catch (err) {
            if (attempt === MAX_RETRY_ATTEMPTS - 1) throw err;
            await sleep(expBackoff(attempt));
        }
    }
    throw new Error('unreachable');
}
```

- `MAX_RETRY_ATTEMPTS = 3`
- `expBackoff(attempt) = Math.min(400 * Math.pow(2, attempt), 3000)` (capped at 3s)
- Location: `src/shared/lib/retry.ts`

**Pattern — 401 Token Refresh:**
In `apiClient()` at `src/shared/api/api-client.ts`: if 401 and not already retried, attempt refresh token flow via `POST /auth/web/refresh`, then retry original request with new token. If refresh fails, clear auth state and throw.

## Logging

**Framework:** `console.*` (no dedicated logging library)

**Patterns:**

- Use `console.log()` for debug info
- Use `console.error()` for error messages
- Comments explain intent when logging non-obvious values
- Location: scattered through code as needed, no central logger config

## Comments & Documentation

**When to Comment:**

- Non-obvious logic or business rules
- Explanation of why (not what — code should be self-documenting)
- Edge cases and special handling (e.g., null transmission as string for NestJS)
- Complex calculations or algorithms

**Example — JSDoc Block Comments:**

```typescript
/**
 * Верхнеуровневые группы каталога
 */
export function useTopLevelGroups() {
    return useQuery({
        queryKey: productKeys.topLevelGroups(),
        queryFn: fetchTopLevelGroups,
        staleTime: 5 * 60 * 1000,
    });
}
```

**Example — Inline Comments for Non-Obvious Behavior:**

```typescript
// null передаётся как строка "null" — намеренно, для явной передачи «сброса» параметра.
// Убедиться, что бэкенд ожидает именно строку "null", а не отсутствие параметра.
if (value === null) {
    urlParams.append(key, 'null');
    continue;
}
```

**Language:** Russian — all comments, commit messages, and documentation in Russian

## Function Design

**Size:** Keep functions small and focused. Utility functions typically 5-20 lines. No magic thresholds, but if a function can't fit on screen, consider splitting.

**Parameters:**

- Use destructuring for options: `function useProducts(groupId: string, options?: { hasMaintenance?: boolean })`
- Type all parameters. No `any`. Use union types or generics
- Default values via object spread: `const hasMaintenance = options?.hasMaintenance ?? false`

**Return Values:**

- Always explicit types: `function selectTotalPrice(items: Record<string, TCartItem>): number`
- Prefer typed returns over inference
- Async functions return `Promise<T>`, not bare promises

**Example — API Fetch + Query Hook Pattern:**

```typescript
// Plain async for server-side prefetch
export const fetchTopLevelGroups = () => apiClient<TGroup[]>(`${BASE}/top-level-groups`);

// Hook for client-side queries
export function useTopLevelGroups() {
    return useQuery({
        queryKey: productKeys.topLevelGroups(),
        queryFn: fetchTopLevelGroups,
        staleTime: 5 * 60 * 1000,
    });
}
```

## Module Design

**Exports:**

- Each FSD slice exports public API via `index.ts`
- No direct imports from internal paths
- Example: `src/entities/cart/index.ts` re-exports `useCartStore`, `selectTotalPrice`, types
- `src/entities/cart/model/cart.store.ts` is internal, never imported directly

**Barrel Files:**

- Every slice layer (api/, model/, ui/, lib/) has `index.ts` if exporting
- Aggregation at slice root `index.ts` for public API

**Zustand Stores:**

- Define type first: `type TCartStore = { items: ..., addProduct: ... }`
- Implement with `create()` + `persist()` middleware
- Export pure selectors (functions) separately
- Example: `selectTotalPrice()` is a pure function, not a store selector

## Styling

**Framework:** Tailwind CSS 4 + DaisyUI 5

**Utilities:**

- Shared utility: `cn()` at `src/shared/lib/cn.ts` = `clsx()` + `tailwind-merge`
- Usage: `className={cn('base-class', variant && 'variant-class', props.className)}`

**Custom CSS:**

- Global styles in `src/shared/styles/`
- Component scoped styles in `<component-name>.tsx` with `className=` only
- No CSS modules (Tailwind covers styling needs)

## Type Inference & Generics

**Policy:** Explicit types > inference

- Function parameters: always typed
- Return types: always explicit
- Generic functions: parameterize clearly

**Example:**

```typescript
export function apiClient<T = unknown>(
    path: string,
    options: TApiClientOptions = {},
): Promise<T> { ... }
```

## Constants & Configuration

**Location:** `src/shared/config/`

- `API_URL` — base API endpoint
- `APP_NAME` — application name (use instead of hardcoding 'PROSTOR')
- Environment-specific via `process.env`

**Naming:** `UPPER_SNAKE_CASE` for constants

## Enums vs Objects

**Prefer enums for finite sets of string/number values:**

```typescript
export enum EServiceCategory {
    MONTAZH = 'montazh',
    OBSLUZHIVANIE = 'obsluzhivanie',
}
```

**Prefer objects for constants with behavior:**

```typescript
export const REAL_ESTATE_TYPES = { APARTMENT: 'apartment', HOUSE: 'house' };
```

---

_Convention analysis: 2026-07-03_
