# CLAUDE.md

Инструкции для Claude Code при работе с этим репозиторием.

## Язык общения

- Всегда общайся на русском языке
- Комментарии к коду, коммиты, PR — на русском

## Обзор проекта

**PROSTOR App** — мультиплатформенный фронтенд для CRM PROSTOR (Aqua Kinetics). Единое приложение на Next.js, обслуживающее Web, Telegram Mini App и MAX Mini App.

**Бизнес:** монтаж и обслуживание систем водоочистки + продажа оборудования (фильтры, картриджи). НЕ доставка воды.

**Демо-лендинг:** https://aquaphor-pro.store/

### Связанные репозитории

| Репозиторий | Путь | Назначение |
|-------------|------|------------|
| **prostor-app** | `C:\Users\Diamond\Desktop\prostor-app` | Этот репозиторий — новый мультиплатформенный фронтенд |
| **crm-aqua-kinetics-back** | `C:\Users\Diamond\Desktop\crm-aqua-kinetics-back` | Backend (NestJS) |
| **crm-aqua-kinetics-front** | `C:\Users\Diamond\Desktop\crm-aqua-kinetics-front` | Текущий фронтенд (Vite + React 18, Telegram-only) — будет заменён |
| **crm-aqua-kinetics-osm** | `C:\Users\Diamond\Desktop\crm-aqua-kinetics-osm` | OSRM маршрутизация |

## Технологический стек

### Ядро

| Пакет | Версия | Зачем | Заменяет (из старого фронта) |
|-------|--------|-------|------------------------------|
| **Next.js** | 16.x | Фреймворк, SSR/SSG, App Router | Vite 5 + React Router 6 |
| **React** | 19.x | React Compiler — автоматическая мемоизация | React 18 |
| **TypeScript** | 6.x → 7.x | 6 = мост, 7 = Go-компилятор (10x быстрее, середина 2026) | TS 5.4 |

### UI

| Пакет | Версия | Зачем |
|-------|--------|-------|
| **Tailwind CSS** | 4.2.x | CSS-утилиты, v4 = CSS-based конфиг |
| **DaisyUI** | 5.5.x | Визуальные UI-компоненты поверх Tailwind |
| **@headlessui/react** | 2.x | Логика UI-компонентов (dialog, combobox, menu, transitions) |
| **@heroicons/react** | 2.x | Иконки |
| **clsx + tailwind-merge** | — | Утилита для className (мерж конфликтующих Tailwind классов) |

### State & Data

| Пакет | Версия | Зачем |
|-------|--------|-------|
| **TanStack Query** | 5.x | API-слой, кэширование, мутации, SSR prefetch |
| **Zustand** | 5.x | Клиентский стейт (корзина, UI) — без провайдеров |
| **date-fns** | 4.x | Работа с датами |

### Формы & Валидация

| Пакет | Версия | Зачем |
|-------|--------|-------|
| **React Hook Form** | 7.x | Управление формами (uncontrolled, минимум ре-рендеров) |
| **@hookform/resolvers** | 3.x | Связка RHF + Zod |
| **Zod** | 3.x | Валидация, схемы, автовывод типов |

### Аутентификация

| Пакет | Зачем |
|-------|-------|
| **NextAuth / Auth.js** | Логин/пароль, Яндекс ID (OAuth), magic link, JWT, сессии |
| **@telegram-apps/sdk-react** 3.x | Для Telegram Mini App layout |

### Карты

| Пакет | Версия | Зачем |
|-------|--------|-------|
| **MapLibre GL JS** | 5.x | Рендер карт (WebGL, open-source, бесплатно) |
| **react-map-gl** | 7.x | React-обёртка над MapLibre (от Visgl) |
| **MapTiler** | — | Провайдер тайлов (бесплатный тариф 100k запросов/мес) |

Карта — подложка под свои данные. Геокодинг — AHunter (через бэкенд прокси). Маршруты — свой OSRM. Заменяет `@pbe/react-yandex-maps` (нет поддержки).

### Утилитарные библиотеки

| Пакет | Версия | Зачем |
|-------|--------|-------|
| **@turf/turf** | 7.x | Геовычисления (полигоны зон, расстояния, площади) |
| **react-datepicker** | 8.x | Выбор дат (расписание, дата заказа) |
| **react-toastify** | 11.x | Уведомления / тосты |
| **react-virtuoso** | 4.x | Виртуализация длинных списков (заказы, товары) |
| **swiper** | 11.x | Карусели (каталог, фото товаров) |
| **react-intersection-observer** | 10.x | Lazy loading, infinite scroll |
| **react-zoom-pan-pinch** | 3.x | Зум фото товаров/оборудования |
| **@tailwindcss/typography** | — | Типографика для markdown-контента (devDep) |

### Платежи

| Пакет | Зачем |
|-------|-------|
| **ЮKassa виджет** | Прямая интеграция для веба (без привязки к мессенджеру) |
| **Telegram Payments** | Для Mini App layout (существующий) |

### Layout группы и стратегии рендеринга

| Layout group | Назначение | Рендеринг | Авторизация |
|---|---|---|---|
| **(web)** | Публичный веб — каталог, лендинг | **SSG / ISR** (SEO, скорость) | NextAuth (опционально) |
| **(web)** | Личный кабинет — заказы, профиль, корзина | **SSR** (данные пользователя) | NextAuth (обязательно) |
| **(miniapp)** | Telegram / MAX Mini App | **CSR** (`'use client'`) | initDataRaw / initData |
| **(dashboard)** | Мастера, кураторы, админы | **CSR** (`'use client'`) | NextAuth + проверка роли |

- **(web)** — серверный layout, Header/Footer, навигация. Статика где можно (каталог — ISR с ревалидацией), SSR где нужны данные пользователя
- **(miniapp)** — клиентский layout, без chrome браузера, платформенный UI
- **(dashboard)** — клиентский layout, sidebar-навигация, много интерактива (карта, чат, календарь, таблицы). Роли: SERVICE, CURATOR, ADMIN
- Бизнес-логика, UI-компоненты, TanStack Query хуки — в FSD-слоях (`entities/`, `features/`, `shared/`), общие для всех layout'ов
- Один деплой, один домен, разные точки входа

### Adapter Pattern (MessengerAdapter)

Бизнес-логика не зависит от платформы. Платформенный код изолирован в адаптерах:

```
Business Logic → MessengerAdapter interface
                    ├── TelegramAdapter (initDataRaw)
                    ├── MaxAdapter (initData)
                    └── WebAdapter (JWT, NextAuth)
```

Адаптер предоставляет: аутентификацию, haptic feedback, back button, theme, storage, платежи.

## Аутентификация

### Web

- **Логин/пароль** — основной способ входа
- **Яндекс ID (OAuth)** — быстрый вход одной кнопкой
- **Magic link** — мост из Telegram/MAX в веб без регистрации
- Подтверждение email/телефона, сброс пароля

### Mini App

- **Telegram:** `initDataRaw` (существующий механизм)
- **MAX:** `initData` (почти идентичный SDK)

### Один пользователь = один аккаунт

Связь через номер телефона. Вход из Telegram, MAX и Web — одни и те же заказы, объекты, корзина.

## Backend API

Backend (NestJS) расположен в `crm-aqua-kinetics-back`. Единый API для всех клиентов. Тип платформы определяется по заголовку авторизации.

### Ключевые API модули

- **Auth** — мульти-аутентификация (Telegram initData, JWT, OAuth)
- **User** — профили, роли (CLIENT, SERVICE, CURATOR, ADMIN)
- **Order** — заказы + синхронизация с МойСклад
- **Cart** — корзина (товары + услуги)
- **Catalog** — товары и услуги из МойСклад
- **RealEstate** — объекты недвижимости клиентов
- **Zones** — зоны обслуживания (OSM данные)
- **Payment** — ЮKassa + Telegram Payments
- **Chat** — чат между клиентом и мастером
- **InstalledEquipment** — установленное оборудование, напоминания о замене

### Swagger

API документация: `{BACKEND_URL}/api/docs`

### Линтинг & Форматирование

| Пакет | Зачем |
|-------|-------|
| **ESLint** 9.x (flat config) | Линтинг (включая eslint-plugin-next, @typescript-eslint) |
| **Prettier** | Форматирование кода |
| **Husky** | Git hooks (pre-commit) |
| **lint-staged** | Запуск линтеров только на staged файлах |

## Архитектура: FSD + App Router

Проект использует **Feature-Sliced Design**, адаптированный под Next.js App Router:

```
src/
├── app/                        — Next.js App Router = FSD-слой pages
│   ├── (web)/                  — Web layout (SSG/ISR + SSR)
│   ├── (miniapp)/              — Mini App layout (CSR, 'use client')
│   ├── (dashboard)/            — Панель мастеров/кураторов/админов (CSR, 'use client')
│   ├── api/                    — BFF / NextAuth endpoints
│   └── layout.tsx              — Root layout
│
├── widgets/                    — Составные блоки UI (header, navigation, sidebar)
│
├── features/                   — Бизнес-фичи (checkout-form, service-settings)
│
├── entities/                   — Сущности (user, order, product, cart)
│   └── product/
│       ├── api/                — TanStack Query хуки (useProducts, useProduct)
│       ├── model/              — Zustand store, бизнес-логика
│       ├── ui/                 — UI компоненты сущности
│       └── types/              — Типы (t-product.ts)
│
└── shared/                     — Общее (не зависит от бизнеса)
    ├── ui/                     — Переиспользуемые UI-компоненты
    ├── api/                    — API-клиент (fetch обёртка), конфиг TanStack Query
    ├── hooks/                  — Общие хуки
    ├── lib/                    — Утилиты, хелперы
    │   └── messenger/          — Adapter Pattern (Telegram/MAX/Web)
    ├── types/                  — Общие типы
    └── styles/                 — Глобальные стили
```

### Правила FSD (ОБЯЗАТЕЛЬНО)

FSD — **строгое архитектурное требование**. Весь код ДОЛЖЕН следовать FSD. Нарушение структуры FSD недопустимо.

- **Импорты только сверху вниз:** `app → widgets → features → entities → shared`. Нарушение направления импортов запрещено
- **Нельзя** импортировать из соседнего слайса того же слоя (entity не импортирует entity напрямую). Для cross-entity зависимостей — поднимать в `features/`
- **Public API:** каждый слайс экспортирует через `index.ts`. Импорт из внутренних файлов слайса напрямую запрещён
- **`app/`** — только маршрутизация и композиция, без бизнес-логики
- **Новые файлы** — всегда размещать в правильном FSD-слое. Не создавать файлы вне структуры `src/`

## Конвенции кода

### Общие

- **Отступы:** 4 пробела (табы запрещены)
- **Типы:** используем `type` (не `interface`) с префиксом `T` → `TPaymentInfo`, `TCheckoutSession`
- **Файлы типов:** `types/t-имя-типа.ts` → `types/t-payment-info.ts`
- **Никаких `any`** — использовать `unknown`, дженерики, Zod-инференс. ESLint правило `@typescript-eslint/no-explicit-any: "error"`
- **React 19:** НЕ использовать `useMemo`, `useCallback`, `React.memo` — React Compiler делает это автоматически
- **Компоненты по умолчанию серверные** (без `'use client'`). `'use client'` только когда нужен клиентский JS

### Pre-commit (Husky + lint-staged)

На каждый коммит автоматически:
1. **Prettier** — форматирование staged файлов
2. **ESLint --fix** — автофикс линтинг-ошибок
3. **TypeScript** — проверка типов (`tsc --noEmit`)

## Что переезжает из старого фронта без изменений

- DaisyUI компоненты + Tailwind стили
- Типы (переименовать если нужно под конвенцию `T`-префикса)
- Бизнес-логика (утилиты, хелперы)
- date-fns форматирование

## Что нужно переписать

- **RTK Query слайсы → TanStack Query хуки** (эндпоинты и типы те же, меняется обёртка)
- **Redux стейт → Zustand сторы** (корзина, UI-состояние)
- React Router → App Router (маршрутизация)
- `useMemo` / `useCallback` / `React.memo` → убрать (React Compiler)
- Telegram SDK прямые вызовы → Messenger Adapter
- Аутентификация → мульти-auth (NextAuth + initData)

## Этапы реализации

### Этап 0: Подготовка бэкенда (блокер, 2-3 недели)

- Миграция User.id с Telegram bigint на UUID
- Таблица UserIdentity (platform + externalId)
- Рефакторинг AuthService под мульти-аутентификацию
- Обновить deleteUser (GDPR) для новой структуры

### Этап 1: Web MVP (4-6 недель)

- Бойлерплейт Next.js 16 + React 19 + Tailwind 4 + DaisyUI 5
- Перенос shared-компонентов из старого фронта
- Web авторизация (логин/пароль + Яндекс ID + magic link)
- Каталог, корзина, оплата (ЮKassa виджет), профиль

### Этап 2: MAX (2-3 недели)

- Адаптер поверх готовой архитектуры (SDK почти идентичен Telegram)

### Этап 3: Полный Web (4-6 недель)

- Desktop UI для мастеров/кураторов
- Карта, чат, PWA, SEO

## Команда

- **Дмитрий (Pelmenya / Diamond)** — основной разработчик, бэкенд + фронт
- **Пётр** — фронтенд-разработчик

## Источники: текущий фронтенд

Текущий фронтенд (Telegram-only) — **референс** для всех флоу, компонентов и API-взаимодействий.

**Путь:** `C:\Users\Diamond\Desktop\crm-aqua-kinetics-front`
**Стек:** Vite 5 + React 18 + React Router 6 + RTK Query + Tailwind 4 + DaisyUI 5 (beta)
**Ветка:** `dev` (актуальная)

### Структура старого фронта

```
src/
├── app/                        — точка входа, store, providers, роутинг
│   ├── store/store.ts          — Redux store + RTK Query middleware
│   └── router/                 — React Router конфиг
├── entities/                   — сущности (API слайсы, типы, UI)
│   ├── areas/                  — зоны обслуживания (API + карта + селектор)
│   ├── cart/                   — корзина
│   ├── order/                  — заказы
│   ├── product/                — товары/услуги из МойСклад
│   ├── real-estate/            — объекты недвижимости
│   ├── user/                   — пользователи, роли
│   ├── chat/                   — чат
│   ├── installed-equipment/    — установленное оборудование
│   └── ...
├── features/                   — фичи (бизнес-логика UI)
│   ├── service-settings/       — настройки мастера (грейд, зоны, расписание)
│   ├── service-calendar/       — календарь мастера
│   └── ...
├── pages/                      — страницы
│   ├── catalog-page/           — каталог товаров
│   ├── product-page/           — карточка товара
│   ├── cart-page/              — корзина
│   ├── checkout-page/          — оформление заказа
│   ├── orders-page/            — список заказов
│   ├── order-page/             — детали заказа
│   ├── profile-page/           — профиль
│   ├── real-estate-page/       — объект недвижимости
│   ├── curator-area-page/      — управление зонами (куратор)
│   ├── service-area-page/      — выбор зон (мастер)
│   └── ...
├── shared/                     — общие утилиты
│   ├── ui/                     — переиспользуемые компоненты
│   ├── hooks/                  — хуки
│   ├── helpers/                — утилиты
│   └── types/                  — общие типы
└── widgets/                    — виджеты (header, navigation и т.д.)
```

### Что брать из старого фронта

| Что | Откуда | Как переносить |
|-----|--------|----------------|
| **API эндпоинты** | `src/entities/*/api/` | Конвертировать RTK Query → TanStack Query хуки |
| **Типы** | `src/entities/*/api/types.ts`, `src/shared/types/` | Копировать, привести к `T`-префиксу |
| **UI компоненты** | `src/shared/ui/`, `src/entities/*/ui/` | Адаптировать под App Router + FSD |
| **Бизнес-хуки** | `src/shared/hooks/`, `src/features/*/hooks/` | Убрать useMemo/useCallback |
| **Стейт (Redux)** | `src/entities/*/model/` | Конвертировать Redux slices → Zustand stores |
| **Страницы (флоу)** | `src/pages/` | Переписать как page.tsx в App Router |
| **Стили** | Tailwind классы в компонентах | Копировать как есть |

### Ключевые флоу для переноса

1. **Каталог → Товар → Корзина → Checkout → Оплата** — основной путь клиента
2. **Профиль → Объекты → Установленное оборудование** — управление недвижимостью
3. **Заказы → Детали заказа → Отзыв** — история и обратная связь
4. **Настройки мастера → Зоны → Расписание** — онбординг мастера
5. **Куратор → Клиенты → Заказы → Назначение мастера** — рабочий флоу куратора

## Источники: бэкенд

**Путь:** `C:\Users\Diamond\Desktop\crm-aqua-kinetics-back`
**Стек:** NestJS 10 + TypeORM 0.3 + PostgreSQL (PostGIS) + Redis + Telegram Bot (nestjs-telegraf)
**Ветка:** `main`

### Структура бэкенда

```
src/
├── modules/
│   ├── auth/                   — аутентификация (сейчас только Telegram initData)
│   ├── user/                   — пользователи, роли, GDPR удаление
│   ├── bot/                    — Telegram бот (уведомления, команды)
│   ├── cart/                   — корзина
│   ├── order/                  — заказы
│   ├── payment/                — ЮKassa + Telegram Payments
│   ├── real-estate/            — объекты недвижимости
│   ├── installed-equipment/    — установленное оборудование
│   ├── zones/                  — зоны обслуживания (OSM импорт)
│   ├── chat/                   — чат (WebSocket)
│   ├── consultation/           — консультации
│   ├── water-analysis/         — анализ воды
│   ├── moy-sklad/              — интеграция МойСклад (товары, заказы, склад)
│   │   ├── bundle/             — комплекты
│   │   ├── counterparty/       — контрагенты
│   │   ├── customerorder/      — заказы МС
│   │   ├── group/              — группы товаров
│   │   ├── product/            — товары
│   │   ├── service/            — услуги
│   │   ├── stock/              — остатки
│   │   └── webhook/            — вебхуки МС
│   ├── service/                — сервис мастеров (аккаунт, расписание)
│   ├── curator/                — функции куратора
│   ├── order-feedback/         — отзывы о заказах
│   ├── order-polling-sync/     — фоновая синхронизация заказов
│   ├── edtech/                 — обучение мастеров (курсы, квизы, сертификаты)
│   ├── areas/                  — старые зоны (GeneralArea, DailyArea) — deprecated
│   └── ...
├── configs/                    — конфиги (postgres, redis, data-source)
├── shared/                     — декораторы, хелперы, логгер, pipes
└── migrations/                 — миграции TypeORM
```

### Ключевые файлы бэкенда

| Файл | Зачем |
|------|-------|
| `src/modules/auth/auth.service.ts` | Текущая auth логика — нужно расширить под мульти-auth |
| `src/modules/user/user.entity.ts` | User entity — `id: bigint` (Telegram ID) → нужна миграция на UUID |
| `src/modules/user/user.service.ts` | deleteUser() — GDPR, порядок удаления связей |
| `src/configs/postgres.config.ts` | Список всех entity, подключение к БД |
| `src/modules/payment/payment.service.ts` | Текущие платежи через Telegram |
| `.env.example` | Все переменные окружения с описаниями |

## Документация

Подробная документация по миграции: `docs/`
- `docs/strategy/` — общая стратегия, решения
- `docs/research/` — исследования платформ (MAX, Web, PWA)
- `docs/backend/` — изменения бэкенда (User ID, мульти-auth)
- `docs/frontend/` — архитектура фронтенда (Adapter Pattern)
