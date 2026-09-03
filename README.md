# PROSTOR App

Мультиплатформенный фронтенд для CRM PROSTOR (Aqua Kinetics) — монтаж и обслуживание систем водоочистки, продажа оборудования (фильтры, картриджи).

Единое приложение на Next.js, обслуживающее **Web**, **Telegram Mini App** и **MAX Mini App**.

## Демо

https://aquaphor-pro.store/

## Стек

| Категория        | Технологии                                             |
| ---------------- | ------------------------------------------------------ |
| **Ядро**         | Next.js 16, React 19, TypeScript 5+                    |
| **UI**           | Tailwind CSS 4, DaisyUI 5, Headless UI 2, Heroicons 2  |
| **State & Data** | Zustand 5, TanStack Query 5                            |
| **Формы**        | React Hook Form 7, Zod 4, @hookform/resolvers          |
| **Карты**        | MapLibre GL 5, react-map-gl 8, Turf.js 7               |
| **Тесты**        | Vitest 3, Testing Library, MSW 2, Playwright           |
| **Линтинг**      | ESLint 9, Steiger (FSD), Prettier, Husky + lint-staged |
| **Docker**       | Multi-stage build, node:22-alpine, standalone output   |

## Архитектура

### FSD (Feature-Sliced Design 2.1)

```
src/
├── app/                    — Next.js App Router: маршрутизация, layout'ы
│   ├── (web)/              — Web layout (SSG/ISR + SSR)
│   ├── (miniapp)/          — Mini App layout (CSR)
│   └── (dashboard)/        — Панель мастеров/кураторов/админов
│
├── views/                  — Страницы (FSD pages, переименован из-за конфликта с Next.js)
├── widgets/                — Составные блоки UI (header, navigation, sidebar)
├── features/               — Бизнес-фичи (checkout, address-search, real-estate wizard)
├── entities/               — Сущности (user, product, cart, real-estate)
└── shared/                 — Общее (ui, api, hooks, lib, model, config)
```

Импорты строго сверху вниз: `app → views → widgets → features → entities → shared`.

### Adapter Pattern

Бизнес-логика не зависит от платформы. Платформенный код изолирован в адаптерах:

```
Business Logic → PlatformAdapter
                    ├── WebAdapter (JWT, NextAuth)
                    ├── TelegramAdapter (initDataRaw)
                    └── MaxAdapter (initData)
```

### Layout группы

| Layout          | Назначение                | Рендеринг     | Авторизация     |
| --------------- | ------------------------- | ------------- | --------------- |
| **(web)**       | Каталог, ЛК, корзина      | SSG/ISR + SSR | NextAuth        |
| **(miniapp)**   | Telegram / MAX Mini App   | CSR           | initDataRaw     |
| **(dashboard)** | Мастера, кураторы, админы | CSR           | NextAuth + роль |

## Быстрый старт

### Development

```bash
# Установить зависимости
npm install

# Создать .env.local из примера
cp .env.example .env.local
# Заполнить NEXT_PUBLIC_API_URL и другие переменные

# Запустить dev-сервер
npm run dev
# http://localhost:3050
```

### Docker (продакшн)

```bash
# Создать .env рядом с docker-compose.yml с переменными
# docker-compose читает его автоматически

# Создать сеть (если бэкенд ещё не создал)
docker network create crm_network_prod 2>/dev/null || true

# Собрать и запустить
docker compose up -d --build

# Логи
docker compose logs -f prostor_app
```

Образ ~240MB (standalone output, multi-stage build).

## Скрипты

| Команда                 | Описание                         |
| ----------------------- | -------------------------------- |
| `npm run dev`           | Dev-сервер на порту 3050         |
| `npm run build`         | Production build                 |
| `npm start`             | Запуск production                |
| `npm run lint`          | ESLint                           |
| `npm run lint:fsd`      | Проверка FSD-структуры (Steiger) |
| `npm test`              | Запуск тестов (Vitest)           |
| `npm run test:watch`    | Тесты в watch-режиме             |
| `npm run test:coverage` | Тесты с coverage                 |

## Переменные окружения

Шаблон: `.env.example`

| Переменная                     | Описание                          |
| ------------------------------ | --------------------------------- |
| `NEXT_PUBLIC_API_URL`          | URL бэкенда (NestJS)              |
| `NEXT_PUBLIC_SALE_PRICES`      | Типы акционных цен                |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID ключ для push-уведомлений   |
| `PORT_APP`                     | Порт контейнера на хосте (Docker) |

`NEXT_PUBLIC_*` инлайнятся в бандл при билде. При изменении нужен пересбор образа.

## Связанные репозитории

| Репозиторий                 | Стек                                            | Назначение                                            |
| --------------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| **prostor-app**             | Next.js 16, React 19                            | Этот репозиторий — новый мультиплатформенный фронтенд |
| **crm-aqua-kinetics-back**  | NestJS 10, TypeORM, PostgreSQL (PostGIS), Redis | Бэкенд — единый API для всех клиентов                 |
| **crm-aqua-kinetics-front** | Vite 5, React 18, RTK Query                     | Текущий фронтенд (Telegram-only) — будет заменён      |
| **crm-aqua-kinetics-osm**   | OSRM                                            | Маршрутизация                                         |

## Pre-commit

Husky + lint-staged автоматически при каждом коммите:

1. **Prettier** — форматирование
2. **ESLint** — линтинг с автофиксом
3. **Steiger** — проверка FSD-структуры
4. **TypeScript** — проверка типов
5. **Vitest** — тесты затронутых файлов

## Документация

- `docs/features/auth/AUTH_ADAPTER.md` — архитектура авторизации
- `docs/features/cart/CART_STRATEGY.md` — стратегия корзины
- `docs/features/real-estate/REAL_ESTATE.md` — объекты недвижимости
- `docs/backend/STRANGLE_FIG_MIGRATION.md` — миграция бэкенда
- `CLAUDE.md` — инструкции для Claude Code
