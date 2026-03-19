# Бойлерплейт prostor-app: что сделано и что делать дальше

## Текущее состояние

**Готово:**

- Next.js 16 + React 19 + Tailwind 4 + DaisyUI 5
- FSD структура (`app/`, `views/`, `widgets/`, `features/`, `entities/`, `shared/`)
- Шрифт Montserrat (latin + cyrillic)
- DaisyUI тема (oklch, перенесена из старого фронта)
- Breakpoints (Bootstrap-like: 576/768/992/1200)
- CSS утилиты: `scrollbar-hidden`, `text-trim`, `gradient-text`, `gradient-bg`
- `cn()` утилита (clsx + tailwind-merge)
- ESLint 9 + Steiger (FSD-линтер) + Prettier + Husky + lint-staged
- Vitest + Testing Library + Playwright + MSW
- Все зависимости установлены (TanStack Query, Zustand, MapLibre, React Hook Form, Zod и др.)

**Пустые слои (нужно заполнить):**

- `src/entities/` — пусто
- `src/features/` — пусто
- `src/views/` — пусто
- `src/widgets/` — пусто
- `src/app/` — только root layout + заглушка page

---

## Шаг 1: Layout groups (Дмитрий)

Создать три layout группы в `src/app/`:

```
src/app/
├── layout.tsx                  -- Root layout (уже есть)
├── (web)/                      -- Web layout
│   ├── layout.tsx              -- Header, Footer, навигация
│   ├── page.tsx                -- Лендинг / главная
│   ├── catalog/
│   │   ├── page.tsx            -- Каталог товаров (SSG/ISR)
│   │   └── [groupId]/
│   │       ├── page.tsx        -- Группа товаров
│   │       └── [productId]/
│   │           └── page.tsx    -- Карточка товара
│   ├── services/
│   │   ├── page.tsx            -- Каталог услуг
│   │   └── [categorySlug]/
│   │       └── page.tsx        -- Услуги по категории
│   ├── cart/
│   │   └── page.tsx            -- Корзина
│   ├── checkout/
│   │   └── page.tsx            -- Оформление заказа
│   ├── profile/
│   │   └── page.tsx            -- Профиль
│   ├── orders/
│   │   ├── page.tsx            -- Список заказов
│   │   └── [orderId]/
│   │       └── page.tsx        -- Детали заказа
│   ├── login/
│   │   └── page.tsx            -- Вход
│   └── register/
│       └── page.tsx            -- Регистрация
├── (miniapp)/                  -- Mini App layout (Telegram/MAX)
│   ├── layout.tsx              -- CSR, 'use client', initData
│   └── [...path]/
│       └── page.tsx            -- SPA-роутинг внутри Mini App
├── (dashboard)/                -- Dashboard (мастер/куратор/админ)
│   ├── layout.tsx              -- Sidebar, CSR, role guard
│   ├── orders/
│   │   └── page.tsx            -- Таблица заказов
│   ├── clients/
│   │   └── page.tsx            -- Клиенты
│   ├── zones/
│   │   └── page.tsx            -- Зоны обслуживания
│   ├── schedule/
│   │   └── page.tsx            -- Расписание
│   └── settings/
│       └── page.tsx            -- Настройки мастера
└── api/
    ├── auth/
    │   └── [...nextauth]/
    │       └── route.ts        -- NextAuth endpoints
    └── revalidate/
        └── route.ts            -- Webhook для ISR ревалидации
```

**Правило FSD:** `page.tsx` — тонкая обёртка, импортирует готовую страницу из `src/views/`:

```tsx
// src/app/(web)/catalog/page.tsx
import { CatalogPage } from '@/views/catalog';
export default function Page() {
    return <CatalogPage />;
}
```

---

## Шаг 2: Shared слой (Дмитрий + Пётр)

### 2.1. API клиент (Дмитрий)

```
src/shared/
├── api/
│   ├── api-client.ts           -- fetch обёртка с auth header
│   ├── query-client.ts         -- TanStack QueryClient конфиг
│   └── query-provider.tsx      -- QueryClientProvider
```

```typescript
// src/shared/api/api-client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiClient<T>(
    path: string,
    options?: RequestInit & { auth?: string },
): Promise<T> {
    const { auth, ...fetchOptions } = options ?? {};
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
    };
    const res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
}
```

### 2.2. PlatformAdapter (Дмитрий)

```
src/shared/lib/
├── platform/
│   ├── types.ts                -- TPlatformAdapter interface
│   ├── telegram-adapter.ts     -- Telegram SDK
│   ├── max-adapter.ts          -- MAX SDK
│   ├── web-adapter.ts          -- Web (NextAuth JWT)
│   ├── platform-provider.tsx   -- React context
│   └── use-platform.ts         -- hook
```

```typescript
// src/shared/lib/platform/types.ts
export type TPlatformAdapter = {
    platform: 'telegram' | 'max' | 'web';
    getAuthHeader(): string; // 'tma ...', 'max ...', 'Bearer ...'
    hapticFeedback?(type: string): void;
    close?(): void;
    openLink?(url: string): void;
};
```

### 2.3. Auth (Дмитрий)

```
src/shared/lib/
├── auth/
│   ├── auth-config.ts          -- NextAuth конфиг
│   ├── auth-provider.tsx       -- SessionProvider
│   └── use-auth.ts             -- хук (user, login, logout, isAuthenticated)
```

### 2.4. UI компоненты (Пётр)

Перенос из старого фронта `crm-aqua-kinetics-front/src/shared/ui/`:

```
src/shared/ui/
├── button/button.tsx
├── input-field/input-field.tsx
├── modal/modal.tsx
├── full-screen-modal/full-screen-modal.tsx
├── card-image/card-image.tsx
├── loading-spinner/loading-spinner.tsx
├── badge/badge.tsx
├── empty-state/empty-state.tsx
└── ...
```

**Правила переноса:**

- Убрать `useMemo`, `useCallback`, `React.memo` (React 19 Compiler)
- Заменить `className` конкатенацию на `cn()`
- Проверить DaisyUI 5 совместимость (beta → stable)
- Каждый компонент — папка + `index.ts` (public API)

### 2.5. Хуки (Пётр)

```
src/shared/hooks/
├── use-media-query.ts          -- responsive
├── use-debounce.ts
├── use-local-storage.ts
├── use-scroll-lock.ts
└── ...
```

### 2.6. Stores (Дмитрий)

```
src/shared/stores/
├── cart.store.ts               -- Zustand: корзина
├── ui.store.ts                 -- Zustand: UI state (sidebar, modals)
└── ...
```

---

## Шаг 3: Entities слой (Пётр — UI, Дмитрий — API)

```
src/entities/
├── user/
│   ├── api/user.api.ts         -- TanStack Query: useUser, useUpdateProfile
│   ├── model/types/t-user.ts
│   └── ui/user-avatar/user-avatar.tsx
├── product/
│   ├── api/product.api.ts      -- useProducts, useProduct, useProductImages
│   ├── model/types/t-product.ts
│   └── ui/
│       ├── product-card/product-card.tsx
│       └── product-price/product-price.tsx
├── service/
│   ├── api/service.api.ts      -- useServices, useServiceCategories
│   ├── model/types/t-service.ts
│   └── ui/
│       ├── service-card/service-card.tsx
│       └── service-list/service-list.tsx
├── order/
│   ├── api/order.api.ts        -- useOrders, useOrder
│   ├── model/types/t-order.ts
│   └── ui/
│       ├── order-card/order-card.tsx
│       └── order-status-badge/order-status-badge.tsx
├── cart/
│   ├── api/cart.api.ts
│   ├── model/types/t-cart.ts
│   └── ui/
│       ├── cart-item/cart-item.tsx
│       └── cart-summary/cart-summary.tsx
├── real-estate/
│   ├── api/real-estate.api.ts
│   ├── model/types/t-real-estate.ts
│   └── ui/real-estate-card/real-estate-card.tsx
├── installed-equipment/
│   ├── api/installed-equipment.api.ts
│   ├── model/types/t-installed-equipment.ts
│   └── ui/
│       ├── equipment-card/equipment-card.tsx
│       └── component-row/component-row.tsx
└── warranty-card/
    ├── api/warranty-card.api.ts
    └── ui/warranty-card-item/warranty-card-item.tsx
```

---

## Шаг 4: Widgets (Пётр)

```
src/widgets/
├── header/
│   ├── header.tsx              -- Web header (логотип, навигация, корзина, профиль)
│   └── mobile-header.tsx       -- Мобильный header
├── footer/
│   └── footer.tsx              -- Web footer
├── sidebar/
│   └── sidebar.tsx             -- Dashboard sidebar
├── navigation/
│   ├── bottom-nav.tsx          -- Мобильная нижняя навигация
│   └── breadcrumbs.tsx         -- Хлебные крошки (web)
└── cart-widget/
    └── cart-widget.tsx          -- Иконка корзины с badge
```

---

## Шаг 5: Views (Пётр — UI, Дмитрий — логика)

```
src/views/
├── home/                       -- Лендинг
├── catalog/                    -- Каталог товаров
├── product/                    -- Карточка товара
├── services/                   -- Каталог услуг
├── cart/                       -- Корзина
├── checkout/                   -- Оформление заказа
├── login/                      -- Вход
├── register/                   -- Регистрация
├── profile/                    -- Профиль
├── orders/                     -- Список заказов
├── order/                      -- Детали заказа
├── real-estate/                -- Объект недвижимости
├── my-warranties/              -- Мои гарантии
├── dashboard-orders/           -- Заказы (мастер/куратор)
├── dashboard-clients/          -- Клиенты (куратор)
├── dashboard-zones/            -- Зоны (куратор)
├── dashboard-schedule/         -- Расписание (мастер)
└── dashboard-settings/         -- Настройки (мастер)
```

---

## Что откуда переносить

| Из старого фронта                 | В prostor-app                 | Как                        |
| --------------------------------- | ----------------------------- | -------------------------- |
| `entities/*/api/*.ts` (RTK Query) | `entities/*/api/*.api.ts`     | RTK Query → TanStack Query |
| `entities/*/model/types/*.ts`     | `entities/*/model/types/*.ts` | Копировать, `T`-префикс    |
| `shared/ui/*`                     | `shared/ui/*`                 | Адаптировать под FSD       |
| `shared/hooks/*`                  | `shared/hooks/*`              | Убрать useMemo/useCallback |
| `pages/*`                         | `views/*`                     | Переписать под App Router  |
| `widgets/*`                       | `widgets/*`                   | Адаптировать               |
| Redux slices                      | Zustand stores                | Переписать                 |
| React Router                      | App Router                    | Переписать                 |
| Telegram SDK вызовы               | PlatformAdapter               | Изолировать                |
| Tailwind классы                   | Tailwind классы               | Копировать как есть        |
| DaisyUI тема                      | DaisyUI тема                  | Уже перенесена             |
