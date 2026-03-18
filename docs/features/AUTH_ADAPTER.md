# Авторизация: Adapter Pattern

## Статус: 🟡 В работе

| Шаг                  | Описание                                       | Статус      |
| -------------------- | ---------------------------------------------- | ----------- |
| 1. Каркас            | messenger adapter + api-слой + dev-токен       | ⬜ Не начат |
| 2. Web авторизация   | NextAuth (логин/пароль, Яндекс ID, magic link) | ⬜ Не начат |
| 3. Telegram Mini App | TelegramAdapter + @telegram-apps/sdk-react     | ⬜ Не начат |
| 4. MAX Mini App      | MaxAdapter (SDK аналогичен Telegram)           | ⬜ Не начат |

## Архитектура

```
Entity хук (useProducts, useCurrentUser)
    └── useApi()          — подставляет auth header автоматически
        └── apiClient()   — fetch-обёртка (baseUrl, errors, JSON)
            └── auth из MessengerAdapter
                    ├── WebAdapter      — NextAuth JWT (первый)
                    ├── TelegramAdapter — initDataRaw (второй)
                    └── MaxAdapter      — initData (третий)
```

### Принцип

- Entity-хуки (`useProducts`, `useCurrentUser`) вызывают `useApi()` и не знают про авторизацию
- `useApi()` берёт auth header из адаптера и подставляет в каждый запрос
- Адаптер изолирует платформенный код (Telegram SDK, NextAuth, MAX SDK)
- **Платежи** тоже через адаптер — `features/checkout` вызывает `adapter.pay()`, не зная способ оплаты
- При добавлении новой авторизации/платёжки: один файл адаптера + одна строка в фабрике

### Платежи через адаптер

```
features/checkout → adapter.pay(order)
                        ├── TelegramAdapter → Telegram Payments API (нативные Stars / провайдеры)
                        ├── MaxAdapter      → MAX Payments API (нативная оплата)
                        └── WebAdapter      → ЮKassa виджет (iframe / редирект)
```

Бэкенд уже поддерживает оба способа (`payment.service.ts`): ЮKassa + Telegram Payments. Адаптер на фронте выбирает нужный.

### Файловая структура

```
src/shared/lib/messenger/
├── types.ts                            — TPlatform, TMessengerUser, TMessengerAdapter
├── utils/
│   ├── detect-platform.ts              — определение платформы (telegram/max/web)
│   └── detect-platform.test.ts         — SSR, Telegram WebApp, fallback web
├── adapters/
│   ├── telegram-adapter.ts             — Telegram initDataRaw
│   ├── telegram-adapter.test.ts        — init, getAuthHeader, getUser, isAuthenticated
│   ├── web-adapter.ts                  — NextAuth JWT (заглушка → шаг 2)
│   ├── web-adapter.test.ts             — dev-токен из env, fallback без токена
│   ├── max-adapter.ts                  — MAX initData (заглушка → шаг 4)
│   └── max-adapter.test.ts             — заглушка возвращает null/false
├── factory.ts                          — createMessengerAdapter(platform)
├── factory.test.ts                     — возвращает правильный адаптер по платформе
├── messenger-provider.tsx              — React Context + init адаптера
├── hooks/
│   ├── use-messenger.ts                — доступ к адаптеру
│   └── use-auth.ts                     — authHeader, user, isAuthenticated, platform
└── index.ts                            — public API

src/shared/api/
├── api-client.ts                       — fetch-обёртка + ApiError
├── api-client.test.ts                  — GET/POST, auth header, ApiError, без auth
├── query-client.ts                     — TanStack QueryClient (SSR-safe)
├── query-provider.tsx                  — QueryClientProvider
├── use-api.ts                          — useAuth() → apiClient() с auth header
├── use-api.test.ts                     — подстановка auth, прокидывание опций
└── index.ts                            — public API
```

### Тесты (шаг 1)

| Модуль              | Файл теста                 | Что проверяем                                                                                |
| ------------------- | -------------------------- | -------------------------------------------------------------------------------------------- |
| **detect-platform** | `detect-platform.test.ts`  | SSR → `web`, `window.Telegram.WebApp` → `telegram`, без Telegram → `web`                     |
| **TelegramAdapter** | `telegram-adapter.test.ts` | init парсит user, `getAuthHeader()` = `tma <raw>`, `isAuthenticated()` до/после init         |
| **WebAdapter**      | `web-adapter.test.ts`      | dev-токен из env → `Bearer dev:123`, без токена → `null`, `isAuthenticated()`                |
| **MaxAdapter**      | `max-adapter.test.ts`      | заглушка: `getAuthHeader()` = `null`, `isAuthenticated()` = `false`                          |
| **factory**         | `factory.test.ts`          | `telegram` → TelegramAdapter, `web` → WebAdapter, `max` → MaxAdapter                         |
| **apiClient**       | `api-client.test.ts`       | GET/POST корректный URL, auth header подставляется, без auth — нет header, ошибка → ApiError |
| **useApi**          | `use-api.test.ts`          | auth header из useAuth прокидывается в apiClient, доп. опции передаются                      |

## Порядок реализации (web first)

### Шаг 1 — Каркас (без реальной авторизации)

**Фронт (prostor-app):**

- `shared/api/` — apiClient, QueryClient, QueryProvider, useApi
- `shared/lib/messenger/` — типы, detect-platform, заглушки адаптеров, фабрика, провайдер, хуки
- WebAdapter: dev-токен из `.env.local` для разработки
- Layout groups: `(web)`, `(miniapp)`
- Пример: `entities/user` + `useCurrentUser`
- Тесты: detect-platform, telegram-adapter, api-client, use-api

**Бэк:** ничего менять не нужно (dev-login уже работает)

### Шаг 2 — Web авторизация (NextAuth)

**Фронт:**

- Установить NextAuth (Auth.js)
- WebAdapter: получает JWT из NextAuth сессии
- `getAuthHeader()` → `Bearer <jwt>`
- Страницы: логин, регистрация, сброс пароля

**Бэк (crm-aqua-kinetics-back):**

- JWT стратегия в `auth.guard.ts` — распознать `Bearer <jwt>`, валидировать подпись
- `POST /auth/login` — email + пароль → JWT
- `POST /auth/yandex/callback` — обмен code → JWT (Яндекс ID OAuth)
- `POST /auth/magic-link` + `GET /auth/verify?token=` — magic link

**Миграция User.id (параллельно на бэке):**

- Ветка `refactor/user-uuid` в crm-aqua-kinetics-back
- `User.id: bigint` → UUID + таблица `UserIdentity` (platform + externalId)
- Пока миграция идёт — фронт работает с публичными эндпоинтами (каталог, товары, поиск)
- После миграции — подключаем auth эндпоинты

### Шаг 3 — Telegram Mini App

**Фронт:**

- TelegramAdapter: `@telegram-apps/sdk-react`, `retrieveLaunchParams()`
- `getAuthHeader()` → `tma <initDataRaw>`
- `(miniapp)` layout с MessengerProvider

**Бэк:** ничего менять не нужно (уже работает)

### Шаг 4 — MAX Mini App

**Фронт:**

- MaxAdapter: SDK аналогичен Telegram
- `getAuthHeader()` → `max <initData>`

**Бэк:**

- Новый `if (authType === 'max')` в `auth.guard.ts`
- Валидация MAX initData (SDK аналогичен Telegram)

## Изменения бэкенда (сводка)

| Шаг         | Что менять        | Где                                    | Обратная совместимость  |
| ----------- | ----------------- | -------------------------------------- | ----------------------- |
| **1 (dev)** | Уже готово        | `auth.guard.ts` — `Bearer dev:<id>`    | ✅ только `IS_DEV=true` |
| **2 (web)** | JWT стратегия     | `auth.guard.ts` + новые эндпоинты      | ✅ новые `if` в guard   |
| **2 (web)** | User ID миграция  | `user.entity.ts` → UUID + UserIdentity | 🔄 параллельно на бэке  |
| **3 (tma)** | Ничего            | —                                      | —                       |
| **4 (max)** | `max` тип в guard | `auth.guard.ts`                        | ✅ новый `if`           |

## Решения

- [x] User ID миграция: Strangle Fig Pattern — `docs/backend/STRANGLE_FIG_MIGRATION.md`
- [x] Не переписываем бэк — добавляем UUID колонку + UserIdentity таблицу рядом
- [x] PK остаётся bigint — Telegram не ломается
- [ ] NextAuth: ставим сейчас или заглушка в WebAdapter?

## Параллельная работа

```
ФРОНТ (prostor-app)              БЭК (crm-aqua-kinetics-back)
─────────────────────             ──────────────────────────────
Шаг 1: каркас + api-слой    ←→   Шаг 1-2: UUID колонка + UserIdentity
        публичные эндпоинты       (не меняя PK, Telegram работает)
        (каталог, товары)

Шаг 2: NextAuth + WebAdapter ←→   Шаг 3: JWT стратегия + эндпоинты
        (после бэка)              POST /auth/login, OAuth, magic link

                                   Шаг 4: Bull очереди (email, sync)
```
