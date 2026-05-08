# CLAUDE.md

Инструкции для Claude Code при работе с этим репозиторием.

## Текущая задача

### Фронт: Adapter Pattern — `docs/features/auth/AUTH_ADAPTER.md`

| Шаг                  | Описание                                       | Прогресс |
| -------------------- | ---------------------------------------------- | -------- |
| 1. Каркас            | platform adapter + api-слой + dev-токен        | ✅ done  |
| 2. Web авторизация   | NextAuth (логин/пароль, Яндекс ID, magic link) | ⬜ 0%    |
| 3. Telegram Mini App | TelegramAdapter + SDK                          | ⬜ 0%    |
| 4. MAX Mini App      | MaxAdapter                                     | ⬜ 0%    |

### Бэк: Strangle Fig Migration — `docs/backend/STRANGLE_FIG_MIGRATION.md`

| Шаг | Описание                              | Риск   | Прогресс |
| --- | ------------------------------------- | ------ | -------- |
| 1   | UUID колонка в User (не меняя PK)     | 0      | ✅ done  |
| 2   | Таблица UserIdentity                  | 0      | ✅ done  |
| 3   | JWT + OAuth + magic link в auth.guard | Низкий | ⬜ 0%    |
| 4   | Bull/BullMQ очереди                   | 0      | ⬜ 0%    |
| 5   | Тесты на новый код                    | 0      | ⬜ 0%    |

## Язык общения

- Всегда общайся на русском языке
- Комментарии к коду, коммиты, PR — на русском

## Обзор проекта

**PROSTOR App** — мультиплатформенный фронтенд для CRM PROSTOR (Aqua Kinetics). Единое приложение на Next.js, обслуживающее Web, Telegram Mini App и MAX Mini App.

**Бизнес:** монтаж и обслуживание систем водоочистки + продажа оборудования (фильтры, картриджи). НЕ доставка воды.

**Демо-лендинг:** https://aquaphor-pro.store/

### Связанные репозитории

| Репозиторий                 | Путь                                               | Назначение                                                                                                   |
| --------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **prostor-app**             | `C:\Users\Diamond\Desktop\prostor-app`             | Этот репозиторий — новый мультиплатформенный фронтенд                                                        |
| **crm-aqua-kinetics-back**  | `C:\Users\Diamond\Desktop\crm-aqua-kinetics-back`  | Backend (NestJS) — см. `docs/references/BACKEND.md`                                                          |
| **crm-aqua-kinetics-front** | `C:\Users\Diamond\Desktop\crm-aqua-kinetics-front` | Старый фронт (Vite + React 18, Telegram-only) — референс для переноса, см. `docs/references/LEGACY-FRONT.md` |
| **crm-aqua-kinetics-osm**   | `C:\Users\Diamond\Desktop\crm-aqua-kinetics-osm`   | OSRM маршрутизация                                                                                           |

## Технологический стек

**Основа:** Next.js 16 + React 19 + TypeScript 6/7 + Tailwind 4 + DaisyUI 5.

**Данные:** TanStack Query (API) + Zustand (клиентский стейт) + React Hook Form + Zod.

**Auth:** NextAuth (web), `@telegram-apps/sdk-react` (Telegram Mini App), MAX SDK.

**Карты:** MapLibre GL JS + react-map-gl + MapTiler (тайлы). Геокодинг — AHunter через бэкенд. Маршруты — свой OSRM.

**Тесты:** Vitest + Testing Library + MSW + Playwright (e2e).

**Платежи:** ЮKassa (web), Telegram Payments, MAX Payments — все через `PlatformAdapter.pay()`.

> Полный список пакетов с версиями и обоснованиями — [`docs/strategy/TECH-STACK.md`](docs/strategy/TECH-STACK.md).

### Layout группы и стратегии рендеринга

| Layout group    | Назначение                                | Рендеринг                     | Авторизация              |
| --------------- | ----------------------------------------- | ----------------------------- | ------------------------ |
| **(web)**       | Публичный веб — каталог, лендинг          | **SSG / ISR** (SEO, скорость) | NextAuth (опционально)   |
| **(web)**       | Личный кабинет — заказы, профиль, корзина | **SSR** (данные пользователя) | NextAuth (обязательно)   |
| **(miniapp)**   | Telegram / MAX Mini App                   | **CSR** (`'use client'`)      | initDataRaw / initData   |
| **(dashboard)** | Мастера, кураторы, админы                 | **CSR** (`'use client'`)      | NextAuth + проверка роли |

- **(web)** — серверный layout, Header/Footer, навигация. Статика где можно (каталог — ISR), SSR где нужны данные пользователя
- **(miniapp)** — клиентский layout, без chrome браузера, платформенный UI
- **(dashboard)** — клиентский layout, sidebar-навигация, много интерактива. Роли: SERVICE, CURATOR, ADMIN
- Бизнес-логика, UI, TanStack Query хуки — в FSD-слоях (общие для всех layout'ов)
- Один деплой, один домен, разные точки входа

### Adapter Pattern (PlatformAdapter)

Бизнес-логика не зависит от платформы. Платформенный код изолирован в адаптерах:

```
Business Logic → PlatformAdapter interface
                    ├── TelegramAdapter (initDataRaw)
                    ├── MaxAdapter (initData)
                    └── WebAdapter (JWT, NextAuth)
```

Адаптер предоставляет: аутентификацию, платежи, haptic feedback, back button, theme, storage.

**Платежи через адаптер:** `TelegramAdapter.pay()` → Telegram Payments, `MaxAdapter.pay()` → MAX Payments, `WebAdapter.pay()` → ЮKassa виджет. Бизнес-логика в `features/checkout` не знает про способ оплаты.

Детали — [`docs/features/auth/AUTH_ADAPTER.md`](docs/features/auth/AUTH_ADAPTER.md).

## Аутентификация

Мульти-платформенная аутентификация через `PlatformAdapter`. Один бэкенд, разные стратегии входа в зависимости от платформы.

### Web (через NextAuth / Auth.js)

- **Логин/пароль** — основной способ входа
- **Яндекс ID (OAuth)** — быстрый вход одной кнопкой
- **Magic link** — мост из Telegram/MAX в веб без повторной регистрации (отправка ссылки на email/телефон)
- **Подтверждение email/телефона, сброс пароля** — стандартные флоу через NextAuth
- Сессия — JWT, хранится в httpOnly cookie

### Mini App

- **Telegram:** `initDataRaw` — существующий механизм, уже работает в старом фронте и бэке. Валидация подписи на бэкенде через `BOT_TOKEN`
- **MAX:** `initData` — SDK почти идентичен Telegram, бэк добавляет параллельную стратегию валидации

### Один пользователь = один аккаунт

Связь через **номер телефона**. Независимо от точки входа (Telegram, MAX, Web) — один и тот же пользователь видит одни и те же заказы, объекты недвижимости, корзину, чат, установленное оборудование.

На бэкенде за это отвечает таблица `UserIdentity` (`platform` + `externalId` → `userId`), добавленная в рамках Strangle Fig миграции — см. [`docs/backend/STRANGLE_FIG_MIGRATION.md`](docs/backend/STRANGLE_FIG_MIGRATION.md).

### Ролевая модель

Роли из бэка: **CLIENT** (клиент), **SERVICE** (мастер-монтажник), **CURATOR** (куратор-координатор), **ADMIN** (админ). Layout `(dashboard)` доступен только SERVICE/CURATOR/ADMIN.

Полная архитектура (Adapter Pattern, NextAuth конфиг, схемы флоу) — [`docs/features/auth/AUTH_ADAPTER.md`](docs/features/auth/AUTH_ADAPTER.md).

## Backend API

Backend (NestJS) в `crm-aqua-kinetics-back`. Единый API для всех клиентов. Тип платформы определяется по заголовку авторизации.

**Ключевые модули:** Auth (мульти-auth: Telegram initData, JWT, OAuth), User (роли CLIENT/SERVICE/CURATOR/ADMIN), Order (+ МойСклад), Cart, Catalog, RealEstate, Zones (OSM), Payment (ЮKassa + Telegram Payments), Chat, InstalledEquipment.

Swagger: `{BACKEND_URL}/api/docs`

Полная структура модулей, ключевые файлы, стратегия миграции — [`docs/references/BACKEND.md`](docs/references/BACKEND.md).

## Линтинг & Форматирование

| Пакет                        | Зачем                                                    |
| ---------------------------- | -------------------------------------------------------- |
| **ESLint** 9.x (flat config) | Линтинг (включая eslint-plugin-next, @typescript-eslint) |
| **Steiger** 0.x              | FSD-линтер — валидация структуры, импортов, public API   |
| **Prettier**                 | Форматирование кода                                      |
| **Husky**                    | Git hooks (pre-commit)                                   |
| **lint-staged**              | Запуск линтеров только на staged файлах                  |

## Архитектура: FSD + App Router

Проект использует **Feature-Sliced Design 2.1**, адаптированный под Next.js App Router:

```
src/
├── app/                        — Next.js App Router: маршрутизация, layout'ы, провайдеры
│   ├── (web)/                  — Web layout (SSG/ISR + SSR)
│   ├── (miniapp)/              — Mini App layout (CSR, 'use client')
│   ├── (dashboard)/            — Панель мастеров/кураторов/админов (CSR, 'use client')
│   ├── api/                    — BFF / NextAuth endpoints
│   └── layout.tsx              — Root layout
│
├── views/                      — FSD-слой pages (переименован из pages/ — конфликт с Next.js Pages Router)
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
    │   └── platform/           — Adapter Pattern (Telegram/MAX/Web)
    ├── types/                  — Общие типы
    └── styles/                 — Глобальные стили
```

### Правила FSD (ОБЯЗАТЕЛЬНО)

FSD 2.1 — **строгое архитектурное требование**. Весь код ДОЛЖЕН следовать FSD. Нарушение структуры FSD недопустимо. Steiger линтер проверяет соблюдение правил автоматически.

- **Views first (FSD 2.1):** слой `views/` (в FSD это `pages`, но переименован из-за конфликта с Next.js Pages Router) — главная точка композиции. Страница собирает виджеты, фичи и сущности. `app/` — только маршрутизация, layout'ы и провайдеры, без бизнес-логики и UI-композиции. Вся логика страницы — в `views/`
- **Импорты только сверху вниз:** `app → views → widgets → features → entities → shared`. Нарушение направления импортов запрещено
- **Нельзя** импортировать из соседнего слайса того же слоя (entity не импортирует entity напрямую). Для cross-entity зависимостей — поднимать в `features/`
- **Public API:** каждый слайс экспортирует через `index.ts`. Импорт из внутренних файлов слайса напрямую запрещён
- **`app/`** — только маршрутизация, layout'ы и композиция. Без бизнес-логики. `page.tsx` файлы — тонкие обёртки, импортирующие готовую страницу из `src/views/`
- **⚠️ `src/pages/` запрещён** — Next.js воспринимает его как Pages Router. FSD-слой pages живёт в `src/views/`
- **Новые файлы** — всегда размещать в правильном FSD-слое. Не создавать файлы вне структуры `src/`

## Конвенции кода

### Форматирование

- **Отступы:** 4 пробела (табы запрещены)
- **Никаких `any`** — использовать `unknown`, дженерики, Zod-инференс. ESLint правило `@typescript-eslint/no-explicit-any: "error"`
- **React 19:** НЕ использовать `useMemo`, `useCallback`, `React.memo` — React Compiler делает это автоматически
- **Haptic / Telegram SDK:** НЕ импортировать в shared UI компоненты. Haptic доступен только через Platform Adapter в `(miniapp)` layout. Shared компоненты должны работать на всех платформах
- **Компоненты по умолчанию серверные** (без `'use client'`). `'use client'` только когда нужен клиентский JS
- **Header/Footer в layout, не в views.** `app/(web)/layout.tsx` оборачивает все web-страницы. Views содержат только контент. Не дублировать обрамление в каждом view
- **ISR/SSR для публичных данных.** Каталог, товары — prefetchQuery на сервере + HydrationBoundary + revalidate. Скелетоны только как fallback, не основной UX
- **`useSuspenseQuery` vs `useQuery`:** `useSuspenseQuery` / `useSuspenseInfiniteQuery` — когда данные **обязательны** для рендера страницы (detail-страницы, защищённые списки). Страница оборачивается в `<QueryBoundary>` — auth guard ставится **до** него (иначе незалогиненный получит 401 вместо спиннера). `useQuery` / `useInfiniteQuery` с `enabled` — когда запрос условный (поиск с непустым `q`, счётчики, опциональные lookup'ы). `useSuspenseQuery` не поддерживает `enabled: false`.
- **FSD Public API обязательно.** Каждый слайс экспортирует через `index.ts`. Импорт из внутренних файлов (`features/catalog/ui/product-card/product-card.tsx`) запрещён — только через `@/features/catalog`
- **Бизнес-типы в `shared/model/`.** TProduct, TUser, TGroup — единый источник правды. Entities реэкспортируют, не дублируют
- **Не дублировать логику.** Общие паттерны (хлебные крошки, форматирование цен) — выносить в хуки/утилиты в features или shared
- **`h-dvh` вместо `h-screen`** на корневом контейнере — учитывает dynamic viewport на мобилках (адресная строка браузера)
- **Название приложения — через константу.** Не хардкодить строку `'PROSTOR'` в коде. Использовать `APP_NAME` из `@/shared/config`. Это позволяет быстро переименовать приложение в одном месте. Пример использования в metadata: `title: \`Зоны обслуживания — ${APP_NAME}\``

### Нейминг файлов и папок

Всё **kebab-case**. Точка-суффикс = назначение модуля. Префикс = тип сущности.

| Что                          | Паттерн файла                    | Пример                               |
| ---------------------------- | -------------------------------- | ------------------------------------ |
| **Компонент (папка + файл)** | `kebab-case/kebab-case.tsx`      | `input-field/input-field.tsx`        |
| **Хук**                      | `use-kebab-case.ts`              | `use-cart-synchronization.ts`        |
| **Утилита / хелпер**         | `kebab-case.ts`                  | `calculate-total-rate.ts`            |
| **API (TanStack Query)**     | `kebab-case.api.ts`              | `cart.api.ts`                        |
| **Zustand store**            | `kebab-case.store.ts`            | `cart.store.ts`                      |
| **Тест**                     | `kebab-case.test.ts(x)`          | `cart.test.ts`                       |
| **Тип**                      | `t-kebab-case.ts` → `type TName` | `t-payment-info.ts` → `TPaymentInfo` |
| **Enum**                     | `e-kebab-case.ts` → `enum EName` | `e-order-status.ts` → `EOrderStatus` |
| **Public API слайса**        | `index.ts`                       | Обязательно в каждом FSD-слайсе      |

### Нейминг сущностей в коде

| Сущность                 | Правило                              | Пример              |
| ------------------------ | ------------------------------------ | ------------------- |
| **Тип**                  | `type` (не `interface`), префикс `T` | `type TPaymentInfo` |
| **Enum**                 | префикс `E`                          | `enum EOrderStatus` |
| **Хук**                  | префикс `use`                        | `useCart()`         |
| **Компонент**            | PascalCase                           | `ProductCard`       |
| **Переменная / функция** | camelCase                            | `calculateTotal()`  |
| **Константа**            | UPPER_SNAKE_CASE                     | `MAX_RETRY_COUNT`   |

### Mobile First & Адаптивность

**Mobile First** — вёрстка начинается с мобильной версии. Основные клиенты — мессенджеры (Telegram, MAX) и мобильные браузеры. Desktop — расширение через `sm:`, `md:`, `lg:`, `xl:`.

**Кастомные breakpoints** (Bootstrap-like, НЕ стандартные Tailwind):

```css
--breakpoint-sm: 576px; /* стандарт Tailwind: 640px */
--breakpoint-md: 768px; /* совпадает */
--breakpoint-lg: 992px; /* стандарт Tailwind: 1024px */
--breakpoint-xl: 1200px; /* стандарт Tailwind: 1280px */
```

**Safe Area (iPhone notch, Telegram Mini App):** `viewport-fit=cover` в meta viewport + `env(safe-area-inset-bottom)` в паддингах для кнопок, форм, тостов, чата.

**Кастомные CSS-утилиты (перенести из старого фронта):** `.scrollbar-hidden`, `@utility text-trim`, `.gradient-text`, `.gradient-bg`, `.gradient-bg-grey`.

**Шрифт:** Montserrat (weights: 100-900 + italic). **DaisyUI тема:** кастомная `light` с oklch цветами — перенести как есть.

### Тесты

По возможности покрывать тестами весь новый код:

- **Каждый новый модуль** — сопровождается тестом (`kebab-case.test.ts(x)`), рядом с файлом (`cart.store.ts` → `cart.store.test.ts`)
- **Утилиты, хелперы, хуки** — unit-тесты обязательны
- **API-хуки (TanStack Query)** — тесты на запросы и трансформацию данных
- **Zustand stores** — тесты на экшены и селекторы
- **Компоненты** — тесты на рендер и пользовательские сценарии
- **Zod-схемы** — тесты на валидацию (валидные и невалидные данные)

### Мультиклиентность и синхронизация данных

Приложение работает одновременно на нескольких клиентах: **браузерные вкладки, PWA на телефоне, мини-аппы (Telegram/MAX)**. Любые данные, которые меняются на одном клиенте, должны быть доступны на другом.

**Паттерн Stale-While-Revalidate (SWR):** показываем локальные данные мгновенно (stale), в фоне подтягиваем свежие (revalidate), если изменились — обновляем UI. TanStack Query делает `refetchOnWindowFocus` по умолчанию.

**Правила при работе с данными пользователя:**

- **Zustand + persist** — оффлайн-кеш, мгновенный UI. НЕ источник правды для залогиненных
- **Бэк** — источник правды. При фокусе окна / PWA resume подтягиваем свежие данные
- **Pending local changes** — если есть несохранённые изменения (debounce таймер), НЕ перезатирать серверными данными
- **PWA на iPhone** — не перезагружает при resume из background, только `visibilitychange` / `refetchOnWindowFocus`
- **Новые фичи с пользовательскими данными** (заказы, профиль, избранное) — всегда учитывать SWR и мультиклиентность

**Тест-кейсы для мультиклиентных фич:** изменить на A → переключиться на B → обновилось; быстро изменить + переключиться (pending debounce) → локальные не потерялись; оффлайн → изменить → онлайн → синхронизировалось.

### Коммиты (Conventional Commits)

Формат: `тип: описание на русском`

| Тип         | Когда                               |
| ----------- | ----------------------------------- |
| `feat:`     | Новая функциональность              |
| `fix:`      | Исправление бага                    |
| `refactor:` | Рефакторинг без изменения поведения |
| `chore:`    | Конфиги, зависимости, скрипты       |
| `docs:`     | Документация                        |
| `style:`    | Форматирование, стили (не CSS)      |
| `test:`     | Тесты                               |
| `perf:`     | Оптимизация производительности      |

**Правила:**

- Описание на русском, краткое, в повелительном наклонении
- Тело коммита (опционально) — подробности, что и почему
- **Примеры:** `feat: каталог товаров с SSR и пагинацией`, `fix: некорректный расчёт стоимости доставки в корзине`, `refactor: перенос cart API с RTK Query на TanStack Query`

### Pull Request

Заголовок PR = как коммит (`feat: ...`, `fix: ...`). Описание подробное, на русском. Если связано с YouGile — указать ID.

**Шаблон описания:**

```markdown
## Что сделано

- Краткий список изменений (буллеты)

## Зачем

- Мотивация / задача / ссылка на YouGile

## Как тестировать

- Шаги для проверки

## Скриншоты / видео

(если есть UI-изменения)
```

### Pre-commit (Husky + lint-staged)

На каждый коммит автоматически: Prettier → ESLint --fix → Steiger (FSD) → TypeScript (`tsc --noEmit`).

## Git Flow

Все ветки создаются от `dev`, мержатся в `dev` через PR. Прямые коммиты в `main` и `dev` **запрещены**. Префиксы: `feature/`, `fix/`, `refactor/`, `chore/`, `docs/`, `hotfix/`. Перед PR — rebase на свежий `dev`.

Детали (таблица веток, процесс релиза, хотфиксы) — [`docs/workflow/GIT-FLOW.md`](docs/workflow/GIT-FLOW.md).

## Инфраструктура

- **Docker (прод):** Next.js с `output: 'standalone'`, multi-stage Dockerfile, сеть `crm_network_prod`. Детали — [`docs/infra/DOCKER.md`](docs/infra/DOCKER.md).
- **CI/CD:** GitHub Actions — будет настроен позже (линтинг+тесты на PR, автодеплой main, preview-деплой).
- **Переменные окружения:** `.env.local` (не в git), `.env.example` (шаблон). Префикс `NEXT_PUBLIC_` — клиентские, инлайнятся при билде.

## YouGile — управление задачами

Задачи на канбан-доске создаются через API. Токен и ID — в `memory/yougile-kanban.md`.

Жизненный цикл: «В процессе» → «Текущая задача» → «Тестирование» → «Архив» (по команде). Исполнитель фронтенд-задач — уточнять у пользователя (Дмитрий или Пётр).

Формат API (кириллица, Windows), полный процесс — [`docs/tools/YOUGILE.md`](docs/tools/YOUGILE.md).

## Этапы реализации

- **Этап 0:** Strangle Fig бэкенда — UUID в User, UserIdentity, мульти-auth, BullMQ, тесты
- **Этап 1:** Web MVP — бойлерплейт ✅, адаптер ✅, каталог ✅, корзина ✅, PWA manifest ✅; осталось: перенос shared-компонентов, NextAuth, cart sync, оплата, профиль
- **Этап 2:** MAX Mini App — MaxAdapter поверх готовой архитектуры
- **Этап 3:** Полный Web — desktop UI для мастеров/кураторов, карта, чат, PWA, SEO

Детали, чеклисты и TODO — [`docs/strategy/ROADMAP.md`](docs/strategy/ROADMAP.md).

## MCP-серверы (Claude Code)

### Playwright MCP — **must-have для фронт-разработки**

Без Playwright MCP я работаю с фронтом «вслепую» — пишу код, прошу скриншот у разработчика, жду, итерируюсь. С Playwright MCP я сам открываю dev-сервер (`http://localhost:3000`) или прод (https://aquaphor-pro.store/), вижу страницу, кликаю, заполняю формы, читаю консоль и network — петля обратной связи в секундах, не минутах.

**Почему именно Playwright MCP, а не BrowserMCP:**

- Изолированный browser instance — не имеет доступа к твоим живым сессиям (Gmail, банк, Slack), что критично для чужих машин и code review.
- Headless режим — работает в CI и фоне, не мешает твоим вкладкам.
- Поддержка `storageState.json` для persistent auth (логиниться раз — переиспользовать сессию).
- Тот же engine что в `e2e/` тестах (`@playwright/test`) — единая ментальная модель.

**Установка** (один раз, scope=user — глобально для Claude Code):

```powershell
# 1. Скачать chromium binary (~170MB, в C:\Users\Diamond\AppData\Local\ms-playwright\)
npx playwright install chromium

# 2. Зарегистрировать MCP-сервер глобально
claude mcp add playwright --scope user -- npx -y @playwright/mcp@latest

# 3. Проверить что connected
claude mcp list
# → playwright: npx -y @playwright/mcp@latest - ✓ Connected

# 4. Перезапустить Claude Code
```

После рестарта появятся tools `mcp__playwright__browser_navigate`, `..._click`, `..._screenshot`, `..._evaluate`, `..._console_messages` и т.д.

**Whitelist permissions** (опц., чтобы не нажимать allow на каждый browser_click) — добавить в `~/.claude/settings.json`:

```json
{
    "permissions": {
        "allow": ["mcp__playwright__*"]
    }
}
```

**Когда обновлять:** MCP-сервер сам подтягивается через `@latest` при старте Claude Code. Browser binary — раз в 2-3 месяца или при логе «browser not found»: `npx playwright install chromium` ещё раз.

**ОБЯЗАТЕЛЬНОЕ правило для Claude Code:** для просмотра и тестирования любых UI-изменений (новые страницы, компоненты, баги вёрстки, проверка тёмной темы, адаптива, behavior'а на iPad/desktop viewport) использовать **Playwright MCP** — не просить у пользователя скриншот, не «допущать что работает». Стандартный цикл: запустить dev (`npm run dev`) → `mcp__playwright__browser_navigate` на нужный URL → `browser_snapshot` или `browser_take_screenshot` → `browser_console_messages` для проверки ошибок → итерировать. Это ускоряет петлю обратной связи в десятки раз.

### Что ещё в `.mcp.json` (project-scope)

Здесь лежат сервера специфичные для prostor-app — например, MCP к локальному dev-серверу backend'а или YouGile. Глобальные (`playwright`, `flowise-slovo`, `pencil`) живут в `~/.claude.json` и не дублируются здесь.

## Субагенты (Code Review)

В `.claude/agents/` установлены кастомные субагенты. **При вызове Agent tool использовать `subagent_type` из таблицы ниже, а не `general-purpose`.**

| Агент                    | Когда использовать                                               | subagent_type          |
| ------------------------ | ---------------------------------------------------------------- | ---------------------- |
| **code-reviewer**        | Ревью кода: качество, безопасность, дублирование, best practices | `code-reviewer`        |
| **architect-reviewer**   | Архитектурные решения: FSD, паттерны, слои, зависимости          | `architect-reviewer`   |
| **test-automator**       | Генерация тестов, покрытие, стратегия тестирования               | `test-automator`       |
| **performance-engineer** | Оптимизация: бандл, рендер, SSR/ISR, lazy loading                | `performance-engineer` |
| **frontend-developer**   | React, Next.js, Tailwind — реализация UI компонентов             | `frontend-developer`   |

| Команда пользователя         | subagent_type          |
| ---------------------------- | ---------------------- |
| «запусти code-reviewer»      | `code-reviewer`        |
| «проверь архитектуру»        | `architect-reviewer`   |
| «проверь производительность» | `performance-engineer` |
| «сгенерируй тесты»           | `test-automator`       |
| «сделай фронтенд»            | `frontend-developer`   |

Все агенты используют модель `opus`. Рекомендуется запускать `code-reviewer` и `architect-reviewer` **перед каждым PR**.

**Автоматический pre-commit hook** на `git commit` в `.claude/settings.json` проверяет FSD violations, дублирование, cross-slice импорты, бизнес-логику в `app/`, лишний `'use client'`. Если найдены проблемы — коммит блокируется.

Добавление нового агента, детали хука, локальные настройки — [`docs/workflow/SUBAGENTS.md`](docs/workflow/SUBAGENTS.md).

## Документация

### В этом репозитории

**Архитектура и стратегия:**

- [`docs/BOILERPLATE.md`](docs/BOILERPLATE.md) — что сделано и что делать (структура, layout groups, shared/entities/widgets/pages)
- [`docs/strategy/TECH-STACK.md`](docs/strategy/TECH-STACK.md) — полный стек с версиями и обоснованиями
- [`docs/strategy/ROADMAP.md`](docs/strategy/ROADMAP.md) — этапы реализации

**Фичи:**

- [`docs/features/auth/AUTH_ADAPTER.md`](docs/features/auth/AUTH_ADAPTER.md) — Adapter Pattern, авторизация
- [`docs/features/cart/CART_STRATEGY.md`](docs/features/cart/CART_STRATEGY.md) — корзина (Zustand + localStorage → sync после логина)

**Бэкенд:**

- [`docs/backend/STRANGLE_FIG_MIGRATION.md`](docs/backend/STRANGLE_FIG_MIGRATION.md) — план миграции (Strangle Fig, 5 шагов)
- [`docs/references/BACKEND.md`](docs/references/BACKEND.md) — структура бэкенда, ключевые файлы

**Референсы и инфра:**

- [`docs/references/LEGACY-FRONT.md`](docs/references/LEGACY-FRONT.md) — старый фронт (структура, что переносить)
- [`docs/infra/DOCKER.md`](docs/infra/DOCKER.md) — Docker для прода
- [`docs/workflow/GIT-FLOW.md`](docs/workflow/GIT-FLOW.md) — ветки и процесс
- [`docs/workflow/SUBAGENTS.md`](docs/workflow/SUBAGENTS.md) — детали субагентов
- [`docs/tools/YOUGILE.md`](docs/tools/YOUGILE.md) — YouGile API

### В бэкенд-репозитории (crm-aqua-kinetics-back)

- `docs/multi-platform/MIGRATION_PLAN.md` — полный план миграции (8 этапов, распределение, чеклисты)
- `docs/architecture/CATALOG_ARCHITECTURE.md` — архитектура каталога услуг
- `docs/features/service-sales/SERVICE_SALES.md` — бизнес-аналитика (Парето, рейтинг, KPI)

## Команда

- **Дмитрий (Pelmenya / Diamond)** — основной разработчик, бэкенд + фронт
- **Пётр** — фронтенд-разработчик
