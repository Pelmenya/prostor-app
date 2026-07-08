# Requirements: PROSTOR App — Web Auth Rework

**Defined:** 2026-07-03
**Core Value:** Пользователь должен суметь зарегистрироваться и войти (по почте или через Telegram) и остаться авторизованным — вся цепочка issue/refresh/logout токенов обязана работать без дыр.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Registration (email)

- [x] **REG-01**: Пользователь может зарегистрироваться по email/паролю, указав имя, фамилию, email, телефон, пароль (мин. 8 символов) и приняв два чекбокса согласий (`POST /auth/web/register`)
- [x] **REG-02**: После успешной регистрации фронт сохраняет `accessToken`/`refreshToken`, считает пользователя авторизованным и перенаправляет в личный кабинет
- [x] **REG-03**: После регистрации пользователь видит уведомление «Мы отправили письмо для подтверждения почты»
- [x] **REG-04**: Неподтверждённая почта не блокирует вход и доступ к личному кабинету

### Email Verification

- [x] **VERIFY-01**: Пользователь подтверждает почту по ссылке `/verify-email?token=...`, фронт вызывает `POST /auth/verify-email`
- [x] **VERIFY-02**: После успешного подтверждения показывается сообщение «Почта подтверждена»
- [x] **VERIFY-03**: Авторизованный пользователь может запросить повторную отправку письма (`POST /auth/resend-verification`)

### Login (email)

- [x] **LOGIN-01**: Пользователь может войти по email и паролю (`POST /auth/web/login`)
- [x] **LOGIN-02**: При 401 показывается общее сообщение «Неверная почта или пароль» без уточнения, существует ли такой email

### Telegram Login & Registration

- [ ] **TG-01**: Существующий пользователь входит через Telegram: nonce (`POST /auth/telegram/nonce`) → Telegram Login OIDC → `id_token` → `POST /auth/telegram/login` → токены сохранены, редирект в кабинет
- [ ] **TG-02**: Если Telegram-профиль новый (`registrationRequired: true`), показывается форма завершения регистрации: имя/фамилия/аватар — из `profile`, email и телефон — обязательны, два чекбокса согласий, без поля пароля
- [ ] **TG-03**: `registrationToken` хранится только в `sessionStorage`, считается одноразовым и живёт 10 минут; при истечении или неоднозначной сетевой ошибке весь Telegram-вход запускается заново
- [ ] **TG-04**: Если `POST /auth/telegram/register` сообщает, что email уже занят — второй аккаунт не создаётся, показывается сообщение с редиректом на вход по почте, после входа предлагается «Привязать Telegram»

### Account Linking

- [ ] **LINK-01**: Авторизованный по email/паролю пользователь может привязать Telegram: новый nonce → Telegram Login → новый `id_token` → `POST /auth/telegram/link`
- [ ] **LINK-02**: После привязки пользователь может входить обоими способами (email или Telegram)

### Password Management

- [ ] **PASS-01**: Пользователь, зарегистрированный только через Telegram (без пароля), может запросить установку пароля через «Установить/восстановить пароль» (`POST /auth/forgot-password`)
- [ ] **PASS-02**: Пользователь завершает установку/сброс пароля по ссылке `/reset-password?token=...` (`POST /auth/reset-password`)
- [ ] **PASS-03**: После установки пароля пользователь может входить и через Telegram, и по почте

### Session / JWT Lifecycle

- [x] **SESSION-01**: Все защищённые запросы отправляются с `Authorization: Bearer <accessToken>`
- [x] **SESSION-02**: При 401 фронт один раз вызывает `POST /auth/web/refresh`; параллельные refresh-запросы объединяются в один (single-flight), т.к. refresh-токен ротируется
- [x] **SESSION-03**: Успешный refresh заменяет обе пары — `accessToken` и `refreshToken`
- [x] **SESSION-04**: Если refresh тоже вернул 401 — токены очищаются, пользователь перенаправляется на страницу входа
- [x] **SESSION-05**: Пользователь может выйти (`POST /auth/web/logout`); локальная сессия очищается независимо от результата запроса

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Notifications

- **NOTIF-01**: Бот отправляет пользователю уведомления в Telegram по сохранённому `telegramId` — сам механизм доставки уведомлений вне скоупа фронтенда этой итерации

### Cleanup

- **CLEANUP-01**: Удаление неиспользуемого кода Telegram/MAX Mini App (`TelegramAdapter`, `MaxAdapter`, layout-группа `(miniapp)`) — после явного решения о судьбе мультиплатформенности

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                                             | Reason                                                                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| NextAuth / Auth.js                                  | Новый backend-контракт отдаёт голые accessToken/refreshToken для ручного управления — не соответствует модели NextAuth |
| Яндекс ID OAuth                                     | Отменено вместе с NextAuth-планом                                                                                      |
| Magic link (Telegram/MAX → Web)                     | Отменено вместе с NextAuth-планом; мультиплатформенность заморожена                                                    |
| Telegram/MAX Mini App вью-слои                      | Продукт больше не развивает эти платформы, только web                                                                  |
| Реализация backend auth endpoints                   | Уже готова и задеплоена — не в скоупе фронтенда                                                                        |
| Реализация доставки уведомлений через Telegram-бота | Backend/bot-логика, фронт только обеспечивает привязку telegramId через auth-флоу                                      |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase                                              | Status   |
| ----------- | -------------------------------------------------- | -------- |
| REG-01      | Phase 2 — Email Registration, Verification & Login | Complete |
| REG-02      | Phase 2 — Email Registration, Verification & Login | Complete |
| REG-03      | Phase 2 — Email Registration, Verification & Login | Complete |
| REG-04      | Phase 2 — Email Registration, Verification & Login | Complete |
| VERIFY-01   | Phase 2 — Email Registration, Verification & Login | Complete |
| VERIFY-02   | Phase 2 — Email Registration, Verification & Login | Complete |
| VERIFY-03   | Phase 2 — Email Registration, Verification & Login | Complete |
| LOGIN-01    | Phase 2 — Email Registration, Verification & Login | Complete |
| LOGIN-02    | Phase 2 — Email Registration, Verification & Login | Complete |
| TG-01       | Phase 3 — Telegram Login & Registration            | Pending  |
| TG-02       | Phase 3 — Telegram Login & Registration            | Pending  |
| TG-03       | Phase 3 — Telegram Login & Registration            | Pending  |
| TG-04       | Phase 3 — Telegram Login & Registration            | Pending  |
| LINK-01     | Phase 4 — Account Linking & Password Management    | Pending  |
| LINK-02     | Phase 4 — Account Linking & Password Management    | Pending  |
| PASS-01     | Phase 4 — Account Linking & Password Management    | Pending  |
| PASS-02     | Phase 4 — Account Linking & Password Management    | Pending  |
| PASS-03     | Phase 4 — Account Linking & Password Management    | Pending  |
| SESSION-01  | Phase 1 — JWT Session Lifecycle                    | Complete |
| SESSION-02  | Phase 1 — JWT Session Lifecycle                    | Complete |
| SESSION-03  | Phase 1 — JWT Session Lifecycle                    | Complete |
| SESSION-04  | Phase 1 — JWT Session Lifecycle                    | Complete |
| SESSION-05  | Phase 1 — JWT Session Lifecycle                    | Complete |

**Coverage:**

- v1 requirements: 23 total
- Mapped to phases: 23 (roadmap created 2026-07-03)
- Unmapped: 0 ✓

---

_Requirements defined: 2026-07-03_
_Last updated: 2026-07-03 after roadmap creation_
