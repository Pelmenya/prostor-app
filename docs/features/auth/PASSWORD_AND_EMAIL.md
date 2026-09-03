# Смена пароля, восстановление и подтверждение email

## Статус: 🟢 В работе

## Обзор

Три связанные фичи для web-авторизации:

1. **Смена пароля** — залогиненный пользователь меняет пароль в профиле
2. **Забыл пароль** — восстановление доступа через email
3. **Подтверждение email** — верификация email после регистрации

## Архитектура

```
Смена пароля (залогинен):
    Профиль → форма → POST /auth/change-password → OK

Забыл пароль:
    /forgot-password → ввод email → POST /auth/forgot-password
        → бэк создаёт токен → отправляет email со ссылкой
    /reset-password?token=xxx → новый пароль → POST /auth/reset-password → OK

Подтверждение email:
    Регистрация → бэк автоматом шлёт письмо
    Баннер "Подтвердите email" → кнопка "Отправить повторно"
    /verify-email?token=xxx → POST /auth/verify-email → email_is_confirm = true
```

---

## Бэкенд (crm-aqua-kinetics-back)

### Что уже есть

- ✅ JWT инфраструктура (register, login, refresh, logout)
- ✅ Email-сервис (Nodemailer + React-email + SMTP Timeweb)
- ✅ `email` и `email_is_confirm` поля в User entity
- ✅ `passwordHash` (bcrypt)
- ✅ Event-driven архитектура (@nestjs/event-emitter)

### Новые эндпоинты

| Метод | Путь                        | Auth       | Описание                                 |
| ----- | --------------------------- | ---------- | ---------------------------------------- |
| POST  | `/auth/change-password`     | Bearer JWT | Смена пароля (oldPassword + newPassword) |
| POST  | `/auth/forgot-password`     | —          | Отправить ссылку восстановления на email |
| POST  | `/auth/reset-password`      | —          | Сброс пароля по токену                   |
| POST  | `/auth/verify-email`        | —          | Подтверждение email по токену            |
| POST  | `/auth/resend-verification` | Bearer JWT | Повторная отправка письма подтверждения  |

### Новые Entity

#### PasswordResetToken

```typescript
@Entity()
export class PasswordResetToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    token: string; // crypto.randomBytes(32).toString('hex')

    @ManyToOne(() => User)
    user: User;

    @Column({ type: 'timestamp' })
    expiresAt: Date; // +1 час

    @Column({ default: false })
    used: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
```

#### EmailVerificationToken

```typescript
@Entity()
export class EmailVerificationToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    token: string;

    @ManyToOne(() => User)
    user: User;

    @Column({ type: 'timestamp' })
    expiresAt: Date; // +24 часа

    @Column({ default: false })
    used: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
```

### Email-шаблоны (React-email)

| Шаблон                     | Когда отправляется                           |
| -------------------------- | -------------------------------------------- |
| `reset-password.email.tsx` | POST /auth/forgot-password                   |
| `verify-email.email.tsx`   | Регистрация + POST /auth/resend-verification |

### Логика

**Смена пароля:**

1. Проверить oldPassword через bcrypt.compare
2. Хэшировать newPassword
3. Обновить user.passwordHash

**Забыл пароль:**

1. Найти user по email
2. Создать PasswordResetToken (TTL 1 час)
3. Отправить email со ссылкой `{FRONTEND_URL}/reset-password?token=xxx`
4. При POST /reset-password: проверить токен, обновить пароль, пометить used=true
5. Бонус: установить `email_is_confirm = true` (пользователь доказал владение email)

**Подтверждение email:**

1. При регистрации: создать EmailVerificationToken (TTL 24 часа)
2. Отправить email со ссылкой `{FRONTEND_URL}/verify-email?token=xxx`
3. При POST /verify-email: проверить токен, установить email_is_confirm=true

**Безопасность:**

- Токены одноразовые (used=true после использования)
- TTL: reset 1 час, verify 24 часа
- Не раскрывать существование email (forgot-password всегда "письмо отправлено")
- Rate limit на отправку писем (TODO: позже)

---

## Фронтенд (prostor-app)

### Новые страницы

| Страница            | Путь               | Layout | Описание                            |
| ------------------- | ------------------ | ------ | ----------------------------------- |
| Забыл пароль        | `/forgot-password` | (web)  | Форма ввода email                   |
| Сброс пароля        | `/reset-password`  | (web)  | Форма нового пароля (token из URL)  |
| Подтверждение email | `/verify-email`    | (web)  | Автоматическая верификация по token |

### Новые компоненты

| Компонент                 | Слой FSD      | Описание                                    |
| ------------------------- | ------------- | ------------------------------------------- |
| `ForgotPasswordPage`      | views/auth    | Форма email + отправка                      |
| `ResetPasswordPage`       | views/auth    | Форма нового пароля                         |
| `VerifyEmailPage`         | views/auth    | Проверка токена, результат                  |
| `EmailVerificationBanner` | features/auth | Баннер "Подтвердите email" в header/profile |
| `ChangePasswordForm`      | features/auth | Форма смены пароля (для профиля)            |

### API хуки

| Хук                     | Файл              | Эндпоинт                       |
| ----------------------- | ----------------- | ------------------------------ |
| `useChangePassword`     | features/auth/api | POST /auth/change-password     |
| `useForgotPassword`     | features/auth/api | POST /auth/forgot-password     |
| `useResetPassword`      | features/auth/api | POST /auth/reset-password      |
| `useVerifyEmail`        | features/auth/api | POST /auth/verify-email        |
| `useResendVerification` | features/auth/api | POST /auth/resend-verification |

### Валидация (Zod)

```typescript
// Смена пароля
const changePasswordSchema = z
    .object({
        oldPassword: z.string().min(1, 'Введите текущий пароль'),
        newPassword: z.string().min(8, 'Минимум 8 символов'),
        confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmPassword'],
    });

// Забыл пароль
const forgotPasswordSchema = z.object({
    email: z.string().email('Некорректный email'),
});

// Сброс пароля
const resetPasswordSchema = z
    .object({
        password: z.string().min(8, 'Минимум 8 символов'),
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmPassword'],
    });
```

---

## План реализации

### Бэкенд

| Шаг | Описание                                                                              | Прогресс |
| --- | ------------------------------------------------------------------------------------- | -------- |
| 1   | Entity: PasswordResetToken + EmailVerificationToken (synchronize: true, без миграций) | ⬜ 0%    |
| 2   | POST /auth/change-password                                                            | ⬜ 0%    |
| 3   | POST /auth/forgot-password + email шаблон                                             | ⬜ 0%    |
| 4   | POST /auth/reset-password                                                             | ⬜ 0%    |
| 5   | POST /auth/verify-email + email шаблон                                                | ⬜ 0%    |
| 6   | POST /auth/resend-verification                                                        | ⬜ 0%    |
| 7   | Отправка verification email при регистрации                                           | ⬜ 0%    |

### Фронтенд

| Шаг | Описание                  | Прогресс |
| --- | ------------------------- | -------- |
| 1   | API функции (auth-api.ts) | ⬜ 0%    |
| 2   | Zod-схемы валидации       | ⬜ 0%    |
| 3   | Страница /forgot-password | ⬜ 0%    |
| 4   | Страница /reset-password  | ⬜ 0%    |
| 5   | Страница /verify-email    | ⬜ 0%    |
| 6   | Тесты                     | ⬜ 0%    |

**UI компоненты делает Пётр** в рамках личного кабинета:

- ChangePasswordForm (профиль) — использует `useChangePassword()`
- EmailVerificationBanner — использует `useResendVerification()`

---

## Связанные документы

- `docs/features/auth/AUTH_ADAPTER.md` — архитектура авторизации
- `docs/backend/STRANGLE_FIG_MIGRATION.md` — миграция бэкенда
- Бэк: `src/modules/auth/` — текущая auth логика
- Бэк: `src/modules/notifications/` — email-сервис, шаблоны
