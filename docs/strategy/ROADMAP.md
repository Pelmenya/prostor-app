# Дорожная карта (этапы реализации)

## Этап 0: Подготовка бэкенда (Strangle Fig Pattern)

> Подробный план: [`docs/backend/STRANGLE_FIG_MIGRATION.md`](../backend/STRANGLE_FIG_MIGRATION.md)

PK остаётся bigint — Telegram не ломается. Добавляем новое рядом:

1. UUID колонка в User (не меняя PK) — 1 день, риск 0
2. Таблица UserIdentity (platform + externalId) — 2 дня, риск 0
3. JWT + OAuth + magic link в auth.guard — 1 неделя, риск низкий
4. Bull/BullMQ очереди (email, sync) — 1-2 недели, риск 0
5. Тесты на новый код — параллельно

## Этап 1: Web MVP (4-6 недель)

> Архитектура авторизации: [`docs/features/auth/AUTH_ADAPTER.md`](../features/auth/AUTH_ADAPTER.md)

- ✅ Бойлерплейт Next.js 16 + React 19 + Tailwind 4 + DaisyUI 5
- ✅ Весь стек установлен, ESLint + Steiger + Husky настроены
- ✅ Adapter Pattern (platform adapter + api-слой + dev-токен)
- ✅ Каталог + подкаталог + страница товара (публичные эндпоинты)
- ✅ Zustand корзина (localStorage, гостевая)
- ✅ PWA manifest (standalone, без browser chrome на мобилках)
- Перенос остальных shared-компонентов из старого фронта
- Web авторизация (NextAuth — после готовности бэка шаг 3)
- Корзина: sync после логина (`POST /cart/sync`)
- Оплата (ЮKassa виджет), профиль

### TODO: PWA

- Иконки `public/icon-192.png` и `public/icon-512.png` (лого PROSTOR)
- Баннер «Установить приложение» (на 2-3 визит)
- `beforeinstallprompt` для Chrome/Android — перехват и своя кнопка
- iOS инструкция: «Поделиться → На экран Домой»

## Этап 2: MAX (2-3 недели)

- MaxAdapter поверх готовой архитектуры (SDK почти идентичен Telegram)

## Этап 3: Полный Web (4-6 недель)

- Desktop UI для мастеров/кураторов
- Карта, чат, PWA, SEO
