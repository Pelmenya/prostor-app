# PROSTOR App — Web Auth Rework

## What This Is

PROSTOR App — фронтенд для CRM PROSTOR (Aqua Kinetics, монтаж и обслуживание систем водоочистки). Продукт меняет вектор развития: Telegram/MAX Mini App вью-слои больше не развиваются, единственная целевая платформа — web в браузере. Telegram остаётся только как альтернативный способ входа (через Login Widget/OIDC) и канал доставки уведомлений через бота. Эта итерация — полная переделка авторизации под новый backend-контракт (JWT accessToken/refreshToken), который уже задеплоен.

## Core Value

Пользователь должен суметь зарегистрироваться и войти (по почте или через Telegram) и остаться авторизованным — вся цепочка issue/refresh/logout токенов обязана работать без дыр, иначе всё остальное приложение (личный кабинет, заказы, чат) недоступно.

## Business Context

- **Customer**: Клиенты Aqua Kinetics — физлица и B2B-менеджеры объектов, использующие web-версию CRM
- **Revenue model**: Монтаж/обслуживание систем водоочистки + продажа оборудования (не сам фронт)
- **Success metric**: Полный auth-флоу (регистрация, вход, telegram-линковка, refresh, logout) проходит без 401-тупиков и без дублей аккаунтов
- **Strategy notes**: `docs/features/auth/AUTH_ADAPTER.md` (устарел в части NextAuth/Яндекс ID — будет переписан по итогам этого проекта)

## Requirements

### Validated

- ✓ Next.js 16 + React 19 + FSD 2.1 бойлерплейт — существующий
- ✓ PlatformAdapter паттерн (`src/shared/lib/platform/`) — существующий, WebAdapter получит новую auth-реализацию
- ✓ Каталог товаров, корзина (Zustand + backend sync) — существующие
- ✓ PWA manifest — существующий
- ✓ `api-client.ts` с retry/401-интерцептором — существующий, будет адаптирован под новый refresh-контракт

### Active

- [ ] Экран авторизации: «Войти по почте» / «Войти через Telegram» / «Регистрация по почте»
- [ ] Регистрация по email (`POST /auth/web/register`) — имя, фамилия, email, телефон, пароль (мин. 8 симв.), 2 чекбокса согласий
- [ ] Подтверждение email по ссылке (`POST /auth/verify-email`), не блокирует вход; повторная отправка (`POST /auth/resend-verification`)
- [ ] Вход по email/паролю (`POST /auth/web/login`), generic-сообщение при 401 (не палим существование почты)
- [ ] Вход через Telegram для существующего пользователя: nonce → Telegram Login OIDC → id_token → `POST /auth/telegram/login`
- [ ] Регистрация через Telegram для нового пользователя: ветвление по `registrationRequired`, форма завершения (email + телефон, без пароля), `POST /auth/telegram/register`, TTL/одноразовость `registrationToken` (sessionStorage, 10 мин)
- [ ] Обработка конфликта email при telegram-регистрации: сообщение + редирект на вход по почте + предложение привязать Telegram после входа
- [ ] Привязка Telegram к аккаунту с паролем (`POST /auth/telegram/link`) из личного кабинета
- [ ] Восстановление/установка пароля для telegram-only пользователей (`POST /auth/forgot-password` → `/reset-password?token=` → `POST /auth/reset-password`)
- [ ] JWT-жизненный цикл: access ~15 мин, `POST /auth/web/refresh` с дедупликацией параллельных refresh-запросов (ротация refresh-токена), logout (`POST /auth/web/logout`) с локальной очисткой независимо от результата
- [ ] Обновление CLAUDE.md — таблица «Текущая задача» отражает новый auth-курс вместо старого NextAuth/adapter-плана

### Out of Scope

- Telegram Mini App / MAX Mini App вью-слои — не развиваются, но код (TelegramAdapter, MaxAdapter, `(miniapp)` layout) пока не удаляется — отдельная будущая задача по чистке
- NextAuth, Яндекс ID OAuth, magic link — отменены как подход; заменены собственным JWT-флоу через WebAdapter
- ЮKassa/платежи, чат, карта — не затрагиваются этим проектом
- Backend-реализация auth endpoints — уже готова и задеплоена, не в скоупе фронтенда

## Context

- Backend (`crm-aqua-kinetics-back`) уже реализовал и задеплоил все auth-эндпоинты (`/auth/web/*`, `/auth/telegram/*`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password`) — фронт может интегрироваться сразу, без координации по контракту.
- Текущее состояние по `.planning/codebase/CONCERNS.md`: web auth 0% реализован, все `(web)` страницы работают через dev-token с `ssr: false` как временный воркэраунд; 6 страниц помечены `// TODO(NextAuth)`. Эта задача закрывает данный техдолг.
- `api-client.ts` (`src/shared/api/api-client.ts:59-69`) уже содержит интерцептор 401 → `tryRefreshTokens()` — переиспользовать/адаптировать под новый refresh-контракт (single-flight для параллельных refresh, а не только retry).
- Известный баг «401 console noise при cold load» (`docs/backlog/401-auth-refresh-console-noise.md`) может быть закрыт заодно, если реализовать pre-flight JWT expiration check — не обязательно, но уместно в рамках этой работы.
- Дев-токен (`NEXT_PUBLIC_DEMO_TOKEN` в `web-adapter.ts:22`) должен быть выведен из использования после внедрения реального флоу.
- Стек: React Hook Form + Zod для форм — auth-формы (регистрация, логин, завершение telegram-регистрации, восстановление пароля) следуют этому паттерну.

## Constraints

- **Tech stack**: Без NextAuth/Auth.js — собственная реализация в `WebAdapter` (`src/shared/lib/platform/adapters/web-adapter.ts`), хранение токенов и их ротация на фронте
- **Backend contract**: Точная структура запросов/ответов зафиксирована пользователем (см. Key Decisions) — менять нельзя без согласования с backend-агентом
- **FSD**: Auth-формы и флоу — в `features/auth/` (или аналогичном слайсе), публичный API через `index.ts`, без бизнес-логики в `app/`
- **Безопасность**: `registrationToken` одноразовый и живёт 10 минут — хранить только в `sessionStorage`, не в `localStorage`; при 401 на login не раскрывать, существует ли email

## Key Decisions

| Decision                                                          | Rationale                                                                                                                                                                                 | Outcome   |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Отказ от NextAuth в пользу собственного JWT-флоу через WebAdapter | Новый backend-контракт отдаёт голые `accessToken`/`refreshToken` для ручного хранения и ротации — модель NextAuth (httpOnly session, свой `/api/auth/*`) не соответствует этому контракту | — Pending |
| Telegram Mini App / MAX код не удаляется в этом проекте           | Продукт временно замораживает мультиплатформенность, но явного решения снести код ещё нет                                                                                                 | — Pending |
| Backend auth endpoints считаются готовыми и не блокируют фронт    | Пользователь подтвердил: эндпоинты уже задеплоены                                                                                                                                         | ✓ Good    |
| CLAUDE.md обновляется вместе с .planning/                         | Чтобы таблица «Текущая задача» не расходилась с реальным курсом проекта (auth adapter план — устарел)                                                                                     | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-07-03 after initialization_
