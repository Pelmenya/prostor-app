# Источник: бэкенд (crm-aqua-kinetics-back)

Референс по структуре бэкенда для prostor-app — где что лежит, какие файлы трогать при миграции.

**Путь:** `C:\Users\Diamond\Desktop\crm-aqua-kinetics-back`
**Стек:** NestJS 10 + TypeORM 0.3 + PostgreSQL (PostGIS) + Redis + Telegram Bot (nestjs-telegraf)
**Ветка:** `main`

## Стратегия: рефакторинг, НЕ переписывание

Бэкенд **рабочий в проде** и продолжает обслуживать Telegram Mini App. Изменения — **аддитивные и обратно совместимые**:

| Модуль          | Что делаем                                 | Telegram Mini App                       |
| --------------- | ------------------------------------------ | --------------------------------------- |
| **User**        | Добавляем UUID + таблицу `UserIdentity`    | Старый `id: bigint` работает как раньше |
| **Auth**        | Добавляем стратегии JWT, OAuth, magic link | `initDataRaw` валидация остаётся        |
| **Payment**     | Добавляем прямую ЮKassa (виджет/редирект)  | Telegram Payments остаётся              |
| **Контроллеры** | Тип платформы определяется по заголовку    | Существующие эндпоинты не меняются      |
| **Bot**         | Без изменений                              | Уведомления работают                    |

**Принцип:** новый код расширяет, старый не трогаем. Telegram Mini App работает до выключения Telegram.

## Ключевые API модули

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

**Swagger:** `{BACKEND_URL}/api/docs`

## Структура бэкенда

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

## Ключевые файлы бэкенда

| Файл                                     | Зачем                                                             |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `src/modules/auth/auth.service.ts`       | Текущая auth логика — нужно расширить под мульти-auth             |
| `src/modules/user/user.entity.ts`        | User entity — `id: bigint` (Telegram ID) → нужна миграция на UUID |
| `src/modules/user/user.service.ts`       | deleteUser() — GDPR, порядок удаления связей                      |
| `src/configs/postgres.config.ts`         | Список всех entity, подключение к БД                              |
| `src/modules/payment/payment.service.ts` | Текущие платежи через Telegram                                    |
| `.env.example`                           | Все переменные окружения с описаниями                             |

## Документация бэкенда

- `docs/multi-platform/MIGRATION_PLAN.md` — **полный план миграции** (8 этапов, распределение Дмитрий/Пётр, чеклисты)
- `docs/architecture/CATALOG_ARCHITECTURE.md` — архитектура каталога услуг (таблицы, синхронизация МС, API)
- `docs/features/service-sales/SERVICE_SALES.md` — бизнес-аналитика (Парето, рейтинг, KPI)
