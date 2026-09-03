# Корзина: стратегия для web

## Статус: ✅ Реализовано

## Архитектура

```
ГОСТЬ (без логина)                    ЗАЛОГИНЕН
──────────────────                    ──────────
Zustand store                         Zustand store (кеш)
    ↓ persist                             ↑ replaceItems
localStorage                         GET /cart (при загрузке)
    │                                     ↓ debounce 300ms
    │                                 POST /cart (при изменении)
    │
    └──── ЛОГИН ────→ merge(local, backend) → POST /cart
```

## Потоки данных

### 1. Гость (не залогинен)

1. Пользователь добавляет товар → Zustand store обновляется мгновенно
2. Zustand persist → localStorage (переживает перезагрузку)
3. Бэк НЕ знает о корзине — ноль запросов
4. UI: badge на иконке корзины, страница корзины — всё из Zustand

### 2. Логин (merge)

1. Пользователь авторизуется (NextAuth / Telegram / MAX)
2. Фронт делает `GET /cart` — получает серверную корзину
3. Merge на фронте (не нужен отдельный бэк-эндпоинт):
    - Товар есть в обоих → `max(local.count, server.count)`
    - Товар только в localStorage → добавляем
    - Товар только на сервере → оставляем
    - Услуги мержатся аналогично
    - Цены: сервер актуализирует из МойСклад
4. Фронт отправляет `POST /cart` — сохраняет результат merge
5. `replaceItems()` — Zustand загружает ответ бэка
6. `setIsGuest(false)` — переключаемся на бэк-режим

### 3. Залогиненный пользователь

1. Zustand store = кеш бэка
2. Любое изменение → debounce 300ms → `POST /cart`
3. Optimistic updates: UI мгновенный, бэк догоняет
4. При открытии сайта: `GET /cart` → `replaceItems()`

### 4. Logout

1. `setIsGuest(true)` — переключаемся обратно на localStorage
2. Текущие items остаются в Zustand (persist → localStorage)
3. Пользователь не теряет собранную корзину

## Маппинг типов фронт ↔ бэк

Zustand store и бэкенд хранят услуги в разном формате:

| Поле           | Фронт (Zustand)                  | Бэк (TCartState)             |
| -------------- | -------------------------------- | ---------------------------- |
| Инфо об услуге | `serviceInfo: { id, name, ... }` | `service: Partial<TService>` |
| Категория      | `serviceInfo.category`           | отсутствует (не хранится)    |
| Тип цены       | snapshot при добавлении          | актуализируется из МойСклад  |

Маппер `toBackendCartState()` / `fromBackendCartState()` конвертирует между форматами.

## Бэкенд API (существующие эндпоинты)

Новых эндпоинтов **не нужно** — используем существующие:

```
GET  /cart              → TCartState (+ актуализация цен из МойСклад)
POST /cart              → обновить cartState целиком
Authorization: Bearer <jwt>  |  tma <initData>
```

**Merge стратегия реализована на фронте** — GET + merge + POST.

## Совместимость с мини-аппами

- Бэк-корзина = единый источник правды для залогиненных
- Telegram/MAX: пользователь уже залогинен через initData → корзина сразу с бэка
- Web: гостевая корзина → merge при логине → бэк
- Один пользователь (связь по телефону) → одна корзина на всех платформах

## Ограничения

- Гостевая корзина привязана к одному браузеру (не синхронизируется между устройствами до логина)
- Это ок — 95% пользователей не меняют устройство между добавлением в корзину и оплатой

## План реализации

### Шаг 1. Типы бэкенд-корзины + маппер

| Файл                                         | Назначение                                                           |
| -------------------------------------------- | -------------------------------------------------------------------- |
| `src/entities/cart/api/cart.types.ts`        | Типы `TBackendCartState`, `TBackendCartItem`, `TBackendServiceEntry` |
| `src/entities/cart/lib/cart-mappers.ts`      | `toBackendCartState()`, `fromBackendCartState()`                     |
| `src/entities/cart/lib/cart-mappers.test.ts` | Тесты маппера                                                        |

**Прогресс:** ✅ done

### Шаг 2. TanStack Query хуки

| Файл                                | Назначение                                                      |
| ----------------------------------- | --------------------------------------------------------------- |
| `src/entities/cart/api/cart.api.ts` | `useCart()` — GET /cart, `useUpdateCart()` — POST /cart мутация |

**Прогресс:** ✅ done

### Шаг 3. Обновление cart store

| Файл                                         | Изменение                             |
| -------------------------------------------- | ------------------------------------- |
| `src/entities/cart/model/cart.store.ts`      | Добавить `replaceItems(items)` action |
| `src/entities/cart/model/cart.store.test.ts` | Тесты на `replaceItems`               |

**Прогресс:** ✅ done

### Шаг 4. useCartSync — debounce sync

| Файл                                          | Назначение                                     |
| --------------------------------------------- | ---------------------------------------------- |
| `src/features/cart/lib/use-cart-sync.ts`      | Subscribe на store, debounce 300ms, POST /cart |
| `src/features/cart/lib/use-cart-sync.test.ts` | Тесты                                          |

**Прогресс:** ✅ done

### Шаг 5. Merge при логине

| Файл                                               | Назначение                             |
| -------------------------------------------------- | -------------------------------------- |
| `src/features/cart/lib/merge-cart-items.ts`        | Чистая функция merge(local, backend)   |
| `src/features/cart/lib/merge-cart-items.test.ts`   | Тесты merge стратегии                  |
| `src/features/cart/lib/use-cart-merge-on-login.ts` | Хук: GET → merge → POST → replaceItems |

**Прогресс:** ✅ done

### Шаг 6. Интеграция в layout + экспорты

| Файл                                                             | Изменение                                                      |
| ---------------------------------------------------------------- | -------------------------------------------------------------- |
| `src/features/cart/ui/cart-sync-provider/cart-sync-provider.tsx` | Компонент: useCartSync + useCartMergeOnLogin + logout handling |
| `src/app/(web)/layout.tsx`                                       | Подключён `<CartSyncProvider />`                               |
| `src/entities/cart/index.ts`                                     | Добавлены API хуки, типы, маппер                               |
| `src/features/cart/index.ts`                                     | Добавлены CartSyncProvider, mergeCartItems                     |

**Прогресс:** ✅ done

## Связанные документы

- `docs/features/auth/AUTH_ADAPTER.md` — авторизация (login → sync)
- `docs/backend/STRANGLE_FIG_MIGRATION.md` — миграция бэкенда
- Старый фронт: `src/entities/cart/` — RTK Query + Redux cart (референс)
