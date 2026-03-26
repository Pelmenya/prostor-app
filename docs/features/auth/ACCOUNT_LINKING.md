# Привязка аккаунтов и кросс-платформенная авторизация

## Статус: 🟡 В работе

## Принцип

Один пользователь = один аккаунт на всех платформах. Связь через **верифицированный email**.

```
Telegram Mini App ←── verified email ──→ Web (prostor-app)
      │                                        │
      └──────────── Один User.id ──────────────┘
                    Одна корзина
                    Одни заказы
                    Одни объекты
```

**Безопасность:** привязка ТОЛЬКО через подтверждённый email (`email_is_confirm = true`).
Без верификации — нельзя, иначе кто угодно введёт чужой email.

---

## Алгоритм: регистрация на вебе (webRegister)

```
POST /auth/web/register { email, phone, password, ... }
    │
    ├── 1. UserIdentity(web, email) существует?
    │     └── ДА → 400 "Пользователь с таким email уже зарегистрирован"
    │
    ├── 2. User с таким email + email_is_confirm=true?
    │     └── ДА → ПРИВЯЗКА:
    │           ├── Добавить UserIdentity(web, email)
    │           ├── Установить passwordHash
    │           ├── НЕ создавать нового User
    │           ├── Корзина, заказы, объекты — на месте
    │           └── Вернуть JWT tokens (200)
    │
    ├── 3. User с таким email + email_is_confirm=false?
    │     └── ДА → ТРЕБУЕТСЯ ВЕРИФИКАЦИЯ:
    │           ├── Отправить verification email
    │           ├── Вернуть 409 { needsVerification: true }
    │           └── Фронт показывает: "Подтвердите email, затем зарегистрируйтесь"
    │
    └── 4. Email свободен
          └── НОВЫЙ АККАУНТ:
                ├── Создать User (отрицательный ID)
                ├── Создать UserIdentity(web, email)
                ├── Создать Cart, UserConsent
                ├── Отправить welcome email с кнопкой verify
                └── Вернуть JWT tokens (201)
```

## Алгоритм: вход на вебе (webLogin)

```
POST /auth/web/login { email, password }
    │
    ├── Найти UserIdentity(web, email) → User
    ├── Проверить passwordHash
    └── Вернуть JWT tokens
```

Без изменений — работает для всех (новые и привязанные).

## Алгоритм: сброс пароля (forgotPassword)

```
POST /auth/forgot-password { email }
    │
    ├── 1. Найти UserIdentity(web, email) → User
    │     └── Нашли → отправить reset email
    │
    ├── 2. Найти User по email (любая платформа)
    │     ├── Нашли + есть passwordHash → отправить reset email
    │     └── Нашли + нет passwordHash → ничего (только Telegram, нет пароля)
    │
    └── 3. Не нашли → ничего (не раскрываем)

    Всегда возвращает { success: true }
```

## Алгоритм: подтверждение email из телеги

```
Пользователь в Telegram Mini App:
    │
    ├── При регистрации: welcome email с кнопкой "Подтвердить email"
    │
    ├── Кликнул → /verify-email?token=xxx → email_is_confirm = true
    │
    └── Теперь при /register на вебе с тем же email → привязка (кейс 2)
```

---

## Флоу пользователя: Telegram → Web

```
┌─────────────────────────────────────────────────────┐
│ 1. Пользователь в Telegram Mini App                 │
│    - Зарегистрирован с email + phone                │
│    - email_is_confirm = false (не подтвердил)       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 2. Хочет войти в веб → /register                    │
│    - Вводит тот же email + придумывает пароль       │
│    - Бэк: email найден, но НЕ верифицирован         │
│    - Ответ: 409 { needsVerification: true }         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 3. Фронт показывает:                                │
│    "Мы отправили письмо для подтверждения email.     │
│     После подтверждения зарегистрируйтесь повторно" │
│    [Отправить повторно]                              │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 4. Пользователь проверяет почту → кликает ссылку    │
│    → /verify-email?token=xxx                        │
│    → email_is_confirm = true                        │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 5. Снова /register с тем же email + пароль          │
│    - Бэк: email найден + email_is_confirm = true    │
│    - ПРИВЯЗКА: UserIdentity(web) + passwordHash     │
│    - Тот же user.id → все данные на месте           │
│    - JWT tokens → залогинен в вебе                  │
└─────────────────────────────────────────────────────┘
```

## Флоу пользователя: Web → Telegram

```
┌─────────────────────────────────────────────────────┐
│ 1. Пользователь зарегистрирован на вебе             │
│    - User с отрицательным ID, email, passwordHash   │
│    - UserIdentity(web, email)                       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 2. Открывает Telegram Mini App                      │
│    - Telegram отдаёт initData с Telegram ID         │
│    - Бэк: UserIdentity(telegram, tgId) → не найден │
│    - Регистрация в телеге: вводит email + phone     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 3. Бэк при регистрации в телеге:                    │
│    - Email совпал с web-юзером + verified?          │
│    - ДА → привязка: UserIdentity(telegram, tgId)    │
│      к существующему User                           │
│    - НЕТ → новый User с Telegram ID                 │
│    (⬜ TODO: эта логика в registerUserWithConsent)   │
└─────────────────────────────────────────────────────┘
```

---

## Magic Link: Telegram → Web (⬜ TODO — этап 2)

Быстрый переход без регистрации — кнопка в Mini App:

```
Telegram Mini App → кнопка "Открыть в браузере"
    │
    ├── POST /auth/magic-link (с initDataRaw)
    │   └── Бэк создаёт MagicLinkToken (TTL 5 мин)
    │
    ├── URL: {WEB_APP_URL}/auth/magic?token=xxx
    │
    └── Браузер: POST /auth/magic-verify (token)
        ├── Добавляет UserIdentity(web) если нет
        ├── JWT tokens → залогинен
        └── Предложить установить пароль
```

**Entity:** MagicLinkToken (token, userId, expiresAt, used)
**Безопасность:** одноразовый, TTL 5 мин, rate limit 3/15мин

## Magic Link: Web → Telegram (⬜ TODO — этап 3)

```
Web → кнопка "Открыть в Telegram"
    → deep link: https://t.me/prostor_bot?start=magic_xxx
    → Бот: /start magic_xxx → привязка Telegram ID
```

---

## План реализации

### Этап 1: Привязка через регистрацию (текущий)

**Ветка бэк:** `feature/account-linking`
**Ветка фронт:** `feature/account-linking`

#### Бэкенд

| Шаг | Описание                                                     | Прогресс |
| --- | ------------------------------------------------------------ | -------- |
| 1   | webRegister: кейс 2 — привязка при verified email            | ✅ done  |
| 2   | webRegister: кейс 3 — 409 + отправка verification email      | ⬜ 0%    |
| 3   | forgotPassword: поиск по User.email (не только UserIdentity) | ✅ done  |
| 4   | registerUserWithConsent: привязка web→telegram (⬜ позже)    | ⬜ 0%    |

#### Фронтенд

| Шаг | Описание                                                   | Прогресс |
| --- | ---------------------------------------------------------- | -------- |
| 1   | RegisterPage: обработка 409 needsVerification              | ⬜ 0%    |
| 2   | UI: экран "Подтвердите email" с кнопкой повторной отправки | ⬜ 0%    |
| 3   | Тесты                                                      | ⬜ 0%    |

### Этап 2: Magic Link Telegram → Web (⬜ TODO)

| Шаг | Описание                          | Прогресс |
| --- | --------------------------------- | -------- |
| 1   | Entity MagicLinkToken + эндпоинты | ⬜ 0%    |
| 2   | Кнопка в Telegram Mini App        | ⬜ 0%    |
| 3   | Страница /auth/magic на фронте    | ⬜ 0%    |
| 4   | Предложение установить пароль     | ⬜ 0%    |

### Этап 3: Magic Link Web → Telegram (⬜ TODO)

| Шаг | Описание                      | Прогресс |
| --- | ----------------------------- | -------- |
| 1   | Deep link в боте              | ⬜ 0%    |
| 2   | Привязка при /start magic_xxx | ⬜ 0%    |

---

## Связанные документы

- `docs/features/auth/AUTH_ADAPTER.md` — Platform Adapter архитектура
- `docs/features/auth/PASSWORD_AND_EMAIL.md` — сброс пароля, подтверждение email
- `docs/backend/STRANGLE_FIG_MIGRATION.md` — UserIdentity таблица
