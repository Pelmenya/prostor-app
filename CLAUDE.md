# CLAUDE.md

Инструкции для Claude Code при работе с этим репозиторием.

## Текущая задача

### Фронт: Adapter Pattern — `docs/features/AUTH_ADAPTER.md`

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

| Репозиторий                 | Путь                                               | Назначение                                                        |
| --------------------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| **prostor-app**             | `C:\Users\Diamond\Desktop\prostor-app`             | Этот репозиторий — новый мультиплатформенный фронтенд             |
| **crm-aqua-kinetics-back**  | `C:\Users\Diamond\Desktop\crm-aqua-kinetics-back`  | Backend (NestJS)                                                  |
| **crm-aqua-kinetics-front** | `C:\Users\Diamond\Desktop\crm-aqua-kinetics-front` | Текущий фронтенд (Vite + React 18, Telegram-only) — будет заменён |
| **crm-aqua-kinetics-osm**   | `C:\Users\Diamond\Desktop\crm-aqua-kinetics-osm`   | OSRM маршрутизация                                                |

## Технологический стек

> Версии указаны как ориентир (актуальны на начало 2026). При установке использовать **latest** — мажорные версии совпадут или будут выше.

### Ядро

| Пакет          | Версия    | Зачем                                                    | Заменяет (из старого фронта) |
| -------------- | --------- | -------------------------------------------------------- | ---------------------------- |
| **Next.js**    | 16.x      | Фреймворк, SSR/SSG, App Router                           | Vite 5 + React Router 6      |
| **React**      | 19.x      | React Compiler — автоматическая мемоизация               | React 18                     |
| **TypeScript** | 6.x → 7.x | 6 = мост, 7 = Go-компилятор (10x быстрее, середина 2026) | TS 5.4                       |

### UI

| Пакет                     | Версия | Зачем                                                       |
| ------------------------- | ------ | ----------------------------------------------------------- |
| **Tailwind CSS**          | 4.2.x  | CSS-утилиты, v4 = CSS-based конфиг                          |
| **DaisyUI**               | 5.5.x  | Визуальные UI-компоненты поверх Tailwind                    |
| **@headlessui/react**     | 2.x    | Логика UI-компонентов (dialog, combobox, menu, transitions) |
| **@heroicons/react**      | 2.x    | Иконки                                                      |
| **clsx + tailwind-merge** | —      | Утилита для className (мерж конфликтующих Tailwind классов) |

### State & Data

| Пакет              | Версия | Зачем                                            |
| ------------------ | ------ | ------------------------------------------------ |
| **TanStack Query** | 5.x    | API-слой, кэширование, мутации, SSR prefetch     |
| **Zustand**        | 5.x    | Клиентский стейт (корзина, UI) — без провайдеров |
| **date-fns**       | 4.x    | Работа с датами                                  |

### Формы & Валидация

| Пакет                   | Версия | Зачем                                                  |
| ----------------------- | ------ | ------------------------------------------------------ |
| **React Hook Form**     | 7.x    | Управление формами (uncontrolled, минимум ре-рендеров) |
| **@hookform/resolvers** | 3.x    | Связка RHF + Zod                                       |
| **Zod**                 | 3.x    | Валидация, схемы, автовывод типов                      |

### Аутентификация

| Пакет                            | Зачем                                                    |
| -------------------------------- | -------------------------------------------------------- |
| **NextAuth / Auth.js**           | Логин/пароль, Яндекс ID (OAuth), magic link, JWT, сессии |
| **@telegram-apps/sdk-react** 3.x | Для Telegram Mini App layout                             |

### Карты

| Пакет              | Версия | Зачем                                                 |
| ------------------ | ------ | ----------------------------------------------------- |
| **MapLibre GL JS** | 5.x    | Рендер карт (WebGL, open-source, бесплатно)           |
| **react-map-gl**   | 7.x    | React-обёртка над MapLibre (от Visgl)                 |
| **MapTiler**       | —      | Провайдер тайлов (бесплатный тариф 100k запросов/мес) |

Карта — подложка под свои данные. Геокодинг — AHunter (через бэкенд прокси). Маршруты — свой OSRM. Заменяет `@pbe/react-yandex-maps` (нет поддержки).

### Утилитарные библиотеки

| Пакет                           | Версия | Зачем                                                 |
| ------------------------------- | ------ | ----------------------------------------------------- |
| **@turf/turf**                  | 7.x    | Геовычисления (полигоны зон, расстояния, площади)     |
| **react-datepicker**            | 8.x    | Выбор дат (расписание, дата заказа)                   |
| **react-toastify**              | 11.x   | Уведомления / тосты                                   |
| **broad-infinite-list**         | 1.x    | Двунаправленный виртуальный список (чат, ленты) — 2KB |
| **react-virtuoso**              | 4.x    | Виртуализация длинных списков (заказы, товары)        |
| **swiper**                      | 11.x   | Карусели (каталог, фото товаров)                      |
| **react-intersection-observer** | 10.x   | Lazy loading, infinite scroll                         |
| **react-zoom-pan-pinch**        | 3.x    | Зум фото товаров/оборудования                         |
| **@tailwindcss/typography**     | —      | Типографика для markdown-контента (devDep)            |

### Тестирование

| Пакет                           | Версия | Зачем                                            |
| ------------------------------- | ------ | ------------------------------------------------ |
| **Vitest**                      | 3.x    | Тест-раннер (быстрее Jest, нативный ESM/TS)      |
| **@testing-library/react**      | 16.x   | Тестирование React-компонентов                   |
| **@testing-library/user-event** | 14.x   | Симуляция пользовательских действий (клик, ввод) |
| **happy-dom**                   | —      | DOM-окружение для Vitest (быстрее jsdom)         |
| **MSW (Mock Service Worker)**   | 2.x    | Мок API-запросов для тестов TanStack Query       |
| **Playwright**                  | —      | E2E тесты (мультибраузерные, SSR-совместимые)    |

### Платежи

| Платформа    | Способ оплаты           | Зачем                                                           |
| ------------ | ----------------------- | --------------------------------------------------------------- |
| **Web**      | **ЮKassa виджет**       | Прямая интеграция, iframe/редирект (без привязки к мессенджеру) |
| **Telegram** | **Telegram Payments**   | Нативная оплата внутри Mini App (Stars / провайдеры)            |
| **MAX**      | **MAX Payments** (TODO) | Нативная оплата внутри MAX Mini App                             |

Платежи изолированы в адаптерах — бизнес-логика вызывает `adapter.pay()`, адаптер выбирает способ:

```
features/checkout → PlatformAdapter.pay(order)
                        ├── TelegramAdapter → Telegram Payments API (нативно)
                        ├── MaxAdapter      → MAX Payments API (нативно)
                        └── WebAdapter      → ЮKassa виджет (iframe/редирект)
```

### Layout группы и стратегии рендеринга

| Layout group    | Назначение                                | Рендеринг                     | Авторизация              |
| --------------- | ----------------------------------------- | ----------------------------- | ------------------------ |
| **(web)**       | Публичный веб — каталог, лендинг          | **SSG / ISR** (SEO, скорость) | NextAuth (опционально)   |
| **(web)**       | Личный кабинет — заказы, профиль, корзина | **SSR** (данные пользователя) | NextAuth (обязательно)   |
| **(miniapp)**   | Telegram / MAX Mini App                   | **CSR** (`'use client'`)      | initDataRaw / initData   |
| **(dashboard)** | Мастера, кураторы, админы                 | **CSR** (`'use client'`)      | NextAuth + проверка роли |

- **(web)** — серверный layout, Header/Footer, навигация. Статика где можно (каталог — ISR с ревалидацией), SSR где нужны данные пользователя
- **(miniapp)** — клиентский layout, без chrome браузера, платформенный UI
- **(dashboard)** — клиентский layout, sidebar-навигация, много интерактива (карта, чат, календарь, таблицы). Роли: SERVICE, CURATOR, ADMIN
- Бизнес-логика, UI-компоненты, TanStack Query хуки — в FSD-слоях (`entities/`, `features/`, `shared/`), общие для всех layout'ов
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

**Платежи через адаптер:**

- `TelegramAdapter.pay()` → Telegram Payments API (нативные Stars / провайдеры)
- `MaxAdapter.pay()` → MAX Payments API (нативная оплата)
- `WebAdapter.pay()` → ЮKassa виджет (iframe / редирект)
- Бизнес-логика в `features/checkout` не знает про способ оплаты

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
- **Компоненты по умолчанию серверные** (без `'use client'`). `'use client'` только когда нужен клиентский JS

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

**Safe Area (iPhone notch, Telegram Mini App):**

- `viewport-fit=cover` в meta viewport
- `env(safe-area-inset-bottom)` в паддингах для кнопок, форм, тостов, чата

**Кастомные CSS-утилиты (перенести из старого фронта):**

- `.scrollbar-hidden` — скрытие скроллбара
- `@utility text-trim` — обрезка текста
- `.gradient-text`, `.gradient-bg`, `.gradient-bg-grey` — градиенты

**Шрифт:** Montserrat (weights: 100-900 + italic)

**DaisyUI тема:** кастомная `light` тема с oklch цветами — перенести как есть

### Тесты

По возможности покрывать тестами весь новый код:

- **Каждый новый модуль** — сопровождается тестом (`kebab-case.test.ts(x)`)
- **Утилиты, хелперы, хуки** — unit-тесты обязательны
- **API-хуки (TanStack Query)** — тесты на корректность запросов и трансформацию данных
- **Zustand stores** — тесты на экшены и селекторы
- **Компоненты** — тесты на рендер и пользовательские сценарии
- **Zod-схемы** — тесты на валидацию (валидные и невалидные данные)
- Тесты лежат рядом с модулем: `cart.store.ts` → `cart.store.test.ts`

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
- Тело коммита (опционально) — подробности, что и почему изменено
- **Примеры:**
    - `feat: каталог товаров с SSR и пагинацией`
    - `fix: некорректный расчёт стоимости доставки в корзине`
    - `refactor: перенос cart API с RTK Query на TanStack Query`

### Pull Request

Формат описания PR:

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

**Правила:**

- Заголовок PR = как коммит (`feat: ...`, `fix: ...`)
- Описание подробное, на русском
- Если связано с задачей YouGile — указать ID

### Pre-commit (Husky + lint-staged)

На каждый коммит автоматически:

1. **Prettier** — форматирование staged файлов
2. **ESLint --fix** — автофикс линтинг-ошибок
3. **Steiger** — проверка FSD-структуры и импортов
4. **TypeScript** — проверка типов (`tsc --noEmit`)

## Git Flow

### Ветки

```
main                          ← прод, деплой автоматом
 └── dev                      ← основная ветка разработки
      ├── feature/catalog-ssr ← фича
      ├── fix/cart-total      ← багфикс
      ├── refactor/rtk-to-tq  ← рефакторинг
      └── chore/eslint-config  ← конфиги, инфра
```

| Ветка                 | Назначение                          | Откуда создаётся | Куда мержится                 |
| --------------------- | ----------------------------------- | ---------------- | ----------------------------- |
| **main**              | Прод. Стабильный код, автодеплой    | —                | —                             |
| **dev**               | Разработка. Сюда сливаются все фичи | main             | main (PR, когда готов релиз)  |
| **feature/название**  | Новая функциональность              | dev              | dev (PR)                      |
| **fix/название**      | Исправление бага                    | dev              | dev (PR)                      |
| **refactor/название** | Рефакторинг без изменения поведения | dev              | dev (PR)                      |
| **chore/название**    | Конфиги, зависимости, инфра         | dev              | dev (PR)                      |
| **docs/название**     | Документация (CLAUDE.md, docs/)     | dev              | dev (PR)                      |
| **hotfix/название**   | Срочный фикс прода                  | main             | main (PR) + cherry-pick в dev |

### Процесс

1. **Новая задача** → создать ветку от `dev` (`feature/catalog-ssr`)
2. **Разработка** → коммиты по Conventional Commits
3. **Готово** → PR в `dev`, описание по шаблону, ревью
4. **Мерж в dev** → squash (один коммит на фичу)
5. **Релиз** → PR из `dev` в `main`, проверка на стейдже, мерж
6. **Хотфикс** → от `main`, мерж в `main` + cherry-pick в `dev`

### Правила

- Прямые коммиты в `main` и `dev` **запрещены** — только через PR
- Название ветки = тип + краткое описание на английском (`feature/cart-zustand`, `fix/safe-area-padding`)
- Перед PR — rebase на свежий `dev` (`git rebase dev`)
- Конфликты разрешает автор PR

## CI/CD

GitHub Actions — будет настроен позже. Планируется:

- Линтинг + тесты на каждый PR
- Автодеплой main на прод
- Preview-деплой для PR (опционально)

## Переменные окружения

- `.env.local` — локальные переменные (не в git)
- `.env.example` — шаблон с описаниями всех переменных (в git)
- Переменные с префиксом `NEXT_PUBLIC_` — доступны на клиенте

## YouGile — управление задачами

Задачи на канбан-доске YouGile создаются через API. Токен и ID хранятся в памяти (`memory/yougile-kanban.md`).

### Исполнители

- **Фронтенд-задачи:** Дмитрий Ляпин или Пётр (уточнить у пользователя)
- **Остальное:** Дмитрий Ляпин

### Жизненный цикл задачи

1. **Начало работы** → создать задачу в колонке «В процессе», стикер по типу, исполнитель
2. **Активная разработка** → переместить в «Текущая задача»
3. **Код написан** → переместить в «Тестирование»
4. **По команде пользователя** → переместить в «Архив»

### Формат задачи

- **title:** краткое описание (как коммит: `feat: ...`, `fix: ...`, `refactor: ...`)
- **description:** детали реализации
- **stickers:** по типу задачи (FRONTEND, BACKEND, и т.д.)

### ⚠️ Кириллица в YouGile API (Windows)

Передача кириллицы через `-d '...'` в curl на Windows **ломает кодировку**. Всегда использовать файл:

```bash
cat > /tmp/yg-task.json << 'JSONEOF'
{"title":"feat: название задачи","columnId":"...","description":"Описание"}
JSONEOF
curl -s -X POST "https://yougile.com/api-v2/tasks" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data-binary @/tmp/yg-task.json
```

**Правило:** JSON тело → heredoc в файл (`<< 'JSONEOF'`), curl → `--data-binary @file`.

## Что переезжает из старого фронта без изменений

- DaisyUI компоненты + Tailwind стили
- Типы (переименовать если нужно под конвенцию `T`-префикса)
- Бизнес-логика (утилиты, хелперы)
- date-fns форматирование

**⚠️ Стили копировать 1-в-1 из старого фронта.** Все CSS-классы, размеры, отступы, брейкпоинты уже протестированы на разных разрешениях. Не менять без необходимости — адаптив проверен дизайнером.

## Что нужно переписать

- **RTK Query слайсы → TanStack Query хуки** (эндпоинты и типы те же, меняется обёртка)
- **Redux стейт → Zustand сторы** (корзина, UI-состояние)
- React Router → App Router (маршрутизация)
- `useMemo` / `useCallback` / `React.memo` → убрать (React Compiler)
- Telegram SDK прямые вызовы → Platform Adapter
- Аутентификация → мульти-auth (NextAuth + initData)

## Этапы реализации

### Этап 0: Подготовка бэкенда (Strangle Fig Pattern)

> Подробный план: `docs/backend/STRANGLE_FIG_MIGRATION.md`

PK остаётся bigint — Telegram не ломается. Добавляем новое рядом:

1. UUID колонка в User (не меняя PK) — 1 день, риск 0
2. Таблица UserIdentity (platform + externalId) — 2 дня, риск 0
3. JWT + OAuth + magic link в auth.guard — 1 неделя, риск низкий
4. Bull/BullMQ очереди (email, sync) — 1-2 недели, риск 0
5. Тесты на новый код — параллельно

### Этап 1: Web MVP (4-6 недель)

> Архитектура авторизации: `docs/features/AUTH_ADAPTER.md`

- ✅ Бойлерплейт Next.js 16 + React 19 + Tailwind 4 + DaisyUI 5
- ✅ Весь стек установлен, ESLint + Steiger + Husky настроены
- Adapter Pattern (platform adapter + api-слой + dev-токен)
- Перенос shared-компонентов из старого фронта
- Каталог (публичные эндпоинты, без auth)
- Web авторизация (NextAuth — после готовности бэка шаг 3)
- Корзина, оплата (ЮKassa виджет), профиль

### Этап 2: MAX (2-3 недели)

- MaxAdapter поверх готовой архитектуры (SDK почти идентичен Telegram)

### Этап 3: Полный Web (4-6 недель)

- Desktop UI для мастеров/кураторов
- Карта, чат, PWA, SEO

## Документация

### В этом репозитории

- `docs/BOILERPLATE.md` — **что сделано и что делать** (структура файлов, layout groups, shared, entities, widgets, pages)
- `docs/features/AUTH_ADAPTER.md` — **архитектура авторизации** (Adapter Pattern, фронтенд)
- `docs/backend/STRANGLE_FIG_MIGRATION.md` — **план миграции бэкенда** (Strangle Fig Pattern, 5 шагов)
- `docs/strategy/` — общая стратегия, решения
- `docs/research/` — исследования платформ (MAX, Web, PWA)
- `docs/backend/` — изменения бэкенда
- `docs/frontend/` — архитектура фронтенда

### В бэкенд-репозитории (crm-aqua-kinetics-back)

- `docs/multi-platform/MIGRATION_PLAN.md` — **полный план миграции** (8 этапов, распределение Дмитрий/Пётр, чеклисты)
- `docs/architecture/CATALOG_ARCHITECTURE.md` — архитектура каталога услуг (таблицы, синхронизация МС, API)
- `docs/features/service-sales/SERVICE_SALES.md` — бизнес-аналитика (Парето, рейтинг, KPI)

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

| Что                 | Откуда                                             | Как переносить                                      |
| ------------------- | -------------------------------------------------- | --------------------------------------------------- |
| **API эндпоинты**   | `src/entities/*/api/`                              | Конвертировать RTK Query → TanStack Query хуки      |
| **Типы**            | `src/entities/*/api/types.ts`, `src/shared/types/` | Копировать, привести к `T`-префиксу                 |
| **UI компоненты**   | `src/shared/ui/`, `src/entities/*/ui/`             | Адаптировать под App Router + FSD                   |
| **Бизнес-хуки**     | `src/shared/hooks/`, `src/features/*/hooks/`       | Убрать useMemo/useCallback                          |
| **Стейт (Redux)**   | `src/entities/*/model/`                            | Конвертировать Redux slices → Zustand stores        |
| **Страницы (флоу)** | `src/pages/`                                       | Переписать в `src/views/` + тонкие обёртки в `app/` |
| **Стили**           | Tailwind классы в компонентах                      | Копировать как есть                                 |

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

### Стратегия: рефакторинг, НЕ переписывание

Бэкенд **рабочий в проде** и продолжает обслуживать Telegram Mini App. Изменения — **аддитивные и обратно совместимые**:

| Модуль          | Что делаем                                 | Telegram Mini App                       |
| --------------- | ------------------------------------------ | --------------------------------------- |
| **User**        | Добавляем UUID + таблицу `UserIdentity`    | Старый `id: bigint` работает как раньше |
| **Auth**        | Добавляем стратегии JWT, OAuth, magic link | `initDataRaw` валидация остаётся        |
| **Payment**     | Добавляем прямую ЮKassa (виджет/редирект)  | Telegram Payments остаётся              |
| **Контроллеры** | Тип платформы определяется по заголовку    | Существующие эндпоинты не меняются      |
| **Bot**         | Без изменений                              | Уведомления работают                    |

**Принцип:** новый код расширяет, старый не трогаем. Telegram Mini App работает до выключения Telegram.

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

| Файл                                     | Зачем                                                             |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `src/modules/auth/auth.service.ts`       | Текущая auth логика — нужно расширить под мульти-auth             |
| `src/modules/user/user.entity.ts`        | User entity — `id: bigint` (Telegram ID) → нужна миграция на UUID |
| `src/modules/user/user.service.ts`       | deleteUser() — GDPR, порядок удаления связей                      |
| `src/configs/postgres.config.ts`         | Список всех entity, подключение к БД                              |
| `src/modules/payment/payment.service.ts` | Текущие платежи через Telegram                                    |
| `.env.example`                           | Все переменные окружения с описаниями                             |
