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
- ✓ PlatformAdapter паттерн (`src/shared/lib/platform/`) — существующий, WebAdapter уже читает реальные токены (dev-token удалён из `src/`)
- ✓ Каталог товаров, корзина (Zustand + backend sync) — существующие
- ✓ PWA manifest — существующий
- ✓ Регистрация по email (`POST /auth/web/register`, `src/views/auth/ui/register-page.tsx`) — имя/фамилия/email/телефон/пароль/2 чекбокса согласий, уже реализовано и покрыто тестами (PR #6, #9, #10)
- ✓ Подтверждение email (`POST /auth/verify-email`, `/auth/resend-verification`, `src/views/auth/ui/verify-email-page.tsx`) — уже реализовано (PR #20)
- ✓ Вход по email/паролю (`POST /auth/web/login`, `src/views/auth/ui/login-page.tsx`) с generic-сообщением об ошибке — уже реализовано (PR #6)
- ✓ Восстановление/установка пароля (`POST /auth/forgot-password` → `/reset-password?token=` → `POST /auth/reset-password`, `src/views/auth/ui/forgot-password-page.tsx` + `reset-password-page.tsx`) — уже реализовано (PR #20)
- ✓ `api-client.ts` — уже содержит 401→refresh→retry с single-flight `refreshPromise` и обновлением обеих пар токенов (SESSION-01/02/03 функционально готовы; регрессионных тестов на них нет — см. `.planning/phases/01-jwt-session-lifecycle/01-RESEARCH.md`)
- ✓ Logout (`POST /auth/web/logout`, `use-logout.ts`) — локальная очистка сессии независимо от сетевого результата уже реализована (SESSION-05), теста нет

**⚠ Открытие 2026-07-03 (research Phase 1):** `.planning/codebase/CONCERNS.md`'s раздел про auth оказался устаревшим/неточным — писался по старому `AUTH_ADAPTER.md`, не по факту кода. Реально JWT web-авторизация (login/register/refresh/logout/verify-email/forgot-reset-password) уже landed через PR #6 и последующие, **до** старта этого GSD-проекта. Экран авторизации с выбором «Войти по почте» / «Войти через Telegram» ещё не существует — сейчас `/login` и `/register` отдельные страницы без Telegram-опции.

### Active

- [ ] Экран/точка входа с выбором «Войти по почте» / «Войти через Telegram» / «Регистрация по почте» (сейчас email-флоу существует отдельно, Telegram-опции нет)
- [ ] Вход через Telegram для существующего пользователя: nonce → Telegram Login OIDC → id_token → `POST /auth/telegram/login` — **не реализовано**
- [ ] Регистрация через Telegram для нового пользователя: ветвление по `registrationRequired`, форма завершения (email + телефон, без пароля), `POST /auth/telegram/register`, TTL/одноразовость `registrationToken` (sessionStorage, 10 мин) — **не реализовано**
- [ ] Обработка конфликта email при telegram-регистрации: сообщение + редирект на вход по почте + предложение привязать Telegram после входа — **не реализовано**
- [ ] Привязка Telegram к аккаунту с паролем (`POST /auth/telegram/link`) из личного кабинета — **не реализовано**
- [ ] JWT session lifecycle hardening: single-flight refresh регрессионные тесты (SESSION-02/03), forced-navigation на терминальный 401 (SESSION-04 — реальный пробел, нет редиректа при неудачном refresh), тест logout (SESSION-05)
- [x] Обновление CLAUDE.md — таблица «Текущая задача» отражает новый auth-курс вместо старого NextAuth/adapter-плана

### Out of Scope

- Telegram Mini App / MAX Mini App вью-слои — не развиваются, но код (TelegramAdapter, MaxAdapter, `(miniapp)` layout) пока не удаляется — отдельная будущая задача по чистке
- NextAuth, Яндекс ID OAuth, magic link — отменены как подход; заменены собственным JWT-флоу через WebAdapter
- ЮKassa/платежи, чат, карта — не затрагиваются этим проектом
- Backend-реализация auth endpoints — уже готова и задеплоена, не в скоупе фронтенда

## Context

- Backend (`crm-aqua-kinetics-back`) уже реализовал и задеплоил все auth-эндпоинты (`/auth/web/*`, `/auth/telegram/*`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password`) — фронт может интегрироваться сразу, без координации по контракту.
- ~~Текущее состояние по `.planning/codebase/CONCERNS.md`: web auth 0% реализован...~~ — **устарело**, см. открытие выше. `.planning/phases/01-jwt-session-lifecycle/01-RESEARCH.md` — актуальный источник правды по факту кода.
- `api-client.ts` (`src/shared/api/api-client.ts:85-123`) уже содержит `tryRefreshTokens()` с single-flight `refreshPromise` — не переписывать, только хардить (убрать лишний `await import()`) и покрыть тестами.
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
