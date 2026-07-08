# PROSTOR App — Web Auth Rework

## What This Is

PROSTOR App — фронтенд для CRM PROSTOR (Aqua Kinetics, монтаж и обслуживание систем водоочистки). Продукт меняет вектор развития: Telegram/MAX Mini App вью-слои больше не развиваются, единственная целевая платформа — web в браузере. **Обновление 2026-07-08:** Telegram Login (вход/регистрация через Telegram Login Widget/OIDC на вебе) отменён продуктом целиком — веб-авторизация остаётся строго email/пароль. Telegram как канал доставки уведомлений через бота (`NOTIF-01`, v2, бэкенд-скоуп) этим решением не затронут. Эта итерация — полная переделка авторизации под новый backend-контракт (JWT accessToken/refreshToken), который уже задеплоен.

## Core Value

Пользователь должен суметь зарегистрироваться и войти по почте и остаться авторизованным — вся цепочка issue/refresh/logout токенов обязана работать без дыр, иначе всё остальное приложение (личный кабинет, заказы, чат) недоступно.

## Business Context

- **Customer**: Клиенты Aqua Kinetics — физлица и B2B-менеджеры объектов, использующие web-версию CRM
- **Revenue model**: Монтаж/обслуживание систем водоочистки + продажа оборудования (не сам фронт)
- **Success metric**: Полный auth-флоу (регистрация, вход, refresh, logout) проходит без 401-тупиков и без дублей аккаунтов
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
- ✓ JWT session lifecycle hardening (SESSION-01..05) — регрессионные тесты на single-flight refresh, forced-redirect на терминальный 401 через `SessionExpiredListener`, race-condition фикс (logout во время фонового refresh не воскрешает сессию) — Phase 1, подтверждено ручным браузерным тестом через Playwright MCP
- ✓ Email registration/verification/login hardening (REG-01..04, VERIFY-01..03, LOGIN-01..02) — Phase 2: REG-03 «письмо для подтверждения» уведомление (`RegistrationNoticeListener`), VERIFY-03 повторная отправка письма из личного кабинета, LOGIN-02 статус-gated generic-ошибка (401 → locked-строка, 429/500 → отдельное сообщение, не «неверный пароль»), copy-drift фиксы («Почта подтверждена»). Все 5 code-review находок (1 critical, 3 warning) исправлены и независимо перепроверены verifier'ом. Подтверждено ручным браузерным тестом через Playwright MCP (REG-03 баннер cross-navigation)
- ✓ Shared auth screen shell — `login-page.tsx` содержит только email/пароль форму; disabled-заглушка «Войти через Telegram» (добавлена в Phase 2 под Phase 3) удалена вместе с отменой Phase 3 (2026-07-08)

**⚠ Открытие 2026-07-03 (research Phase 1):** `.planning/codebase/CONCERNS.md`'s раздел про auth оказался устаревшим/неточным — писался по старому `AUTH_ADAPTER.md`, не по факту кода. Реально JWT web-авторизация (login/register/refresh/logout/verify-email/forgot-reset-password) уже landed через PR #6 и последующие, **до** старта этого GSD-проекта. Экран авторизации с выбором «Войти по почте» / «Войти через Telegram» ещё не существует — сейчас `/login` и `/register` отдельные страницы без Telegram-опции.

### Active

- [x] Обновление CLAUDE.md — таблица «Текущая задача» отражает новый auth-курс вместо старого NextAuth/adapter-плана

_(Milestone effectively complete после Phase 2 — Phase 3/4 отменены, см. Out of Scope.)_

### Out of Scope

- **Telegram Login (веб OIDC-вход/регистрация через Login Widget) — отменён продуктом 2026-07-08.** Ранее Phase 3/4: nonce → Telegram Login OIDC → `id_token` → `/auth/telegram/login`/`register`, форма завершения регистрации, TTL/одноразовость `registrationToken`, обработка email-конфликта, привязка Telegram к аккаунту с паролем (`/auth/telegram/link`), установка пароля для telegram-only аккаунтов. Wave 1 (частичная реализация TG-01/TG-03) была смержена и полностью откачена через `git revert`, см. `.planning/phases/03-telegram-login-registration/03-CANCELLED.md`
- Telegram Mini App / MAX Mini App вью-слои — не развиваются, но код (TelegramAdapter, MaxAdapter, `(miniapp)` layout) пока не удаляется — отдельная будущая задача по чистке. **Не путать с Telegram Login выше** — это разные вещи: Mini App = запуск приложения внутри Telegram, Telegram Login = вход в веб-версию через Telegram как провайдер
- NextAuth, Яндекс ID OAuth, magic link — отменены как подход; заменены собственным JWT-флоу через WebAdapter
- ЮKassa/платежи, чат, карта — не затрагиваются этим проектом
- Backend-реализация auth endpoints — уже готова и задеплоена, не в скоупе фронтенда

## Context

- Backend (`crm-aqua-kinetics-back`) уже реализовал и задеплоил все auth-эндпоинты (`/auth/web/*`, `/auth/telegram/*`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password`) — фронт может интегрироваться сразу, без координации по контракту.
- ~~Текущее состояние по `.planning/codebase/CONCERNS.md`: web auth 0% реализован...~~ — **устарело**, см. открытие выше. `.planning/phases/01-jwt-session-lifecycle/01-RESEARCH.md` — актуальный источник правды по факту кода.
- `api-client.ts` (`src/shared/api/api-client.ts:85-123`) уже содержит `tryRefreshTokens()` с single-flight `refreshPromise` — не переписывать, только хардить (убрать лишний `await import()`) и покрыть тестами.
- Известный баг «401 console noise при cold load» (`docs/backlog/401-auth-refresh-console-noise.md`) может быть закрыт заодно, если реализовать pre-flight JWT expiration check — не обязательно, но уместно в рамках этой работы.
- Стек: React Hook Form + Zod для форм — auth-формы (регистрация, логин, завершение telegram-регистрации, восстановление пароля) следуют этому паттерну.

## Constraints

- **Tech stack**: Без NextAuth/Auth.js — собственная реализация в `WebAdapter` (`src/shared/lib/platform/adapters/web-adapter.ts`), хранение токенов и их ротация на фронте
- **Backend contract**: Точная структура запросов/ответов зафиксирована пользователем (см. Key Decisions) — менять нельзя без согласования с backend-агентом
- **FSD**: Auth-формы и флоу — в `features/auth/` (или аналогичном слайсе), публичный API через `index.ts`, без бизнес-логики в `app/`
- **Безопасность**: при 401 на login не раскрывать, существует ли email

## Key Decisions

| Decision                                                              | Rationale                                                                                                                                                                                 | Outcome                                                 |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Отказ от NextAuth в пользу собственного JWT-флоу через WebAdapter     | Новый backend-контракт отдаёт голые `accessToken`/`refreshToken` для ручного хранения и ротации — модель NextAuth (httpOnly session, свой `/api/auth/*`) не соответствует этому контракту | ✓ Good                                                  |
| Telegram Mini App / MAX код не удаляется в этом проекте               | Продукт временно замораживает мультиплатформенность, но явного решения снести код ещё нет                                                                                                 | ✓ Good                                                  |
| Backend auth endpoints считаются готовыми и не блокируют фронт        | Пользователь подтвердил: эндпоинты уже задеплоены                                                                                                                                         | ✓ Good                                                  |
| CLAUDE.md обновляется вместе с .planning/                             | Чтобы таблица «Текущая задача» не расходилась с реальным курсом проекта (auth adapter план — устарел)                                                                                     | ✓ Good                                                  |
| `refreshTokenAtStart`-guard в `tryRefreshTokens()` (CR-01)            | Явный logout во время фонового refresh не должен воскрешать сессию устаревшим результатом refresh — guard сравнивает refresh-токен на входе/выходе single-flight промиса                  | ✓ Good                                                  |
| LOGIN-02: locked-строка только на 401, не на любой `ApiError`         | Review-находка WR-01 (Phase 2) — 429/500 ошибочно показывались как «неверный пароль»; статус-гейтинг предотвращает вводящее в заблуждение сообщение                                       | ✓ Good                                                  |
| Telegram-кнопка на `/login` — disabled в Phase 2, wiring в Phase 3    | UI-SPEC discretion call: показывать нерабочую кнопку хуже, чем честно disabled с tooltip; решение перенесено в план и подтверждено при верификации                                        | Superseded — Phase 3 отменён, кнопка удалена (см. ниже) |
| Phase 3 (Telegram Login) и Phase 4 (Account Linking) отменены целиком | Продукт решил: веб-авторизация остаётся email/пароль-only, без Telegram как способа входа. Wave 1 Phase 3 была смержена и полностью откачена через `git revert` (история сохранена)       | ✓ Good                                                  |

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

_Last updated: 2026-07-08 after Phase 3/4 cancellation_
