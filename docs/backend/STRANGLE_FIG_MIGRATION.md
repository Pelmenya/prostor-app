# Миграция бэкенда: Strangle Fig Pattern

## Статус: 🟡 Планирование

| Шаг | Описание              | Риск   | Оценка      | Статус |
| --- | --------------------- | ------ | ----------- | ------ |
| 1   | UUID колонка в User   | 0      | 1 день      | ⬜     |
| 2   | Таблица UserIdentity  | 0      | 2 дня       | ⬜     |
| 3   | Новые auth стратегии  | Низкий | 1 неделя    | ⬜     |
| 4   | Очереди (Bull/BullMQ) | 0      | 1-2 недели  | ⬜     |
| 5   | Тесты                 | 0      | Параллельно | ⬜     |

## Принцип

**Strangle Fig Pattern** — обвиваем старый код новым, не ломая ничего.

- Каждый шаг маленький, обратимый, тестируемый
- Telegram Mini App работает **на каждом шаге**
- Не переписываем с нуля — слишком много рабочей бизнес-логики (МойСклад, платежи, чат, зоны, GDPR)
- Не делаем big bang рефакторинг — 30+ мест с bigint, одна ошибка = прод лежит

## Текущее состояние бэкенда

```
User.id = bigint (Telegram ID) — PK
├── 9 сущностей с явным @Column({ type: 'bigint' }) userId
├── 8+ сущностей с неявными FK через OneToMany/ManyToOne
├── 1 ManyToMany join table (chat_participants_user)
├── auth.service.ts — Number(userData.user.id) в 5+ местах
├── user.service.ts — GDPR каскадное удаление 20+ таблиц
└── order.repository.ts — clientId/executorId как number
```

**Почему нельзя просто поменять PK:**

- 20+ сущностей, 30+ FK ссылок на User.id
- Все существующие данные завязаны на bigint
- Telegram Mini App в проде — нельзя ломать

## Шаг 1 — UUID колонка (не меняя PK)

**Что:** добавляем колонку `uuid` в таблицу `user`, не трогая `id`.

**Миграция:**

```sql
ALTER TABLE "user" ADD COLUMN "uuid" UUID DEFAULT gen_random_uuid();
UPDATE "user" SET "uuid" = gen_random_uuid() WHERE "uuid" IS NULL;
ALTER TABLE "user" ALTER COLUMN "uuid" SET NOT NULL;
CREATE UNIQUE INDEX idx_user_uuid ON "user"("uuid");
```

**Entity:**

```typescript
@Entity()
export class User {
    @PrimaryColumn({ type: 'bigint' })
    id: number; // ← НЕ ТРОГАЕМ

    @Column({ type: 'uuid', unique: true, default: () => 'gen_random_uuid()' })
    uuid: string; // ← ДОБАВЛЯЕМ

    // ... остальное без изменений
}
```

**Что это даёт:**

- Каждый юзер получает UUID
- Новый фронт может работать через UUID
- Старый код не знает про эту колонку — продолжает работать
- FK, PK, все связи — без изменений

**Риск:** 0 — добавление колонки, ничего не ломает.

## Шаг 2 — Таблица UserIdentity

**Что:** новая таблица для связки платформа + внешний ID → пользователь.

**Миграция:**

```sql
CREATE TABLE user_identity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform, external_id)
);

CREATE INDEX idx_user_identity_user_id ON user_identity(user_id);
CREATE INDEX idx_user_identity_lookup ON user_identity(platform, external_id);

-- Заполняем для существующих Telegram-юзеров
INSERT INTO user_identity (user_id, platform, external_id)
SELECT id, 'telegram', id::text FROM "user";
```

**Entity:**

```typescript
export type TPlatform = 'telegram' | 'web' | 'max';

@Entity()
export class UserIdentity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'bigint' })
    userId: number;

    @Column({ type: 'varchar', length: 20 })
    platform: TPlatform;

    @Column({ type: 'varchar', length: 255 })
    externalId: string;

    @CreateDateColumn()
    createdAt: Date;
}
```

**Сервис:**

```typescript
@Injectable()
export class UserIdentityService {
    async findByPlatform(platform: TPlatform, externalId: string): Promise<User | null> {
        const identity = await this.repo.findOne({
            where: { platform, externalId },
            relations: ['user'],
        });
        return identity?.user ?? null;
    }

    async linkIdentity(userId: number, platform: TPlatform, externalId: string) {
        return this.repo.save({ userId, platform, externalId });
    }
}
```

**Что это даёт:**

- Один юзер = несколько платформ (telegram + web + max)
- Поиск юзера: `findByPlatform('web', 'user@email.com')`
- Связь через номер телефона: оба identity ведут к одному user_id

**Риск:** 0 — новая таблица, старый код не знает о ней.

## Шаг 3 — Новые auth стратегии

**Что:** добавляем JWT и MAX авторизацию РЯДОМ с существующей Telegram.

**auth.guard.ts — добавляем if, НЕ ТРОГАЕМ существующие:**

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] || '';
    const [authType, authData] = authHeader.split(' ');

    // ==========================================
    // СУЩЕСТВУЮЩЕЕ — НЕ ТРОГАЕМ
    // ==========================================

    // Dev-токен
    if (authType === 'Bearer' && authData?.startsWith('dev:') && process.env.IS_DEV === 'true') {
        const userId = Number(authData.split(':')[1]);
        return this.authService.validateDevToken(request, userId);
    }

    // Telegram initDataRaw
    if (authType === 'tma') {
        await this.authService.validateInitData(request);
        return true;
    }

    // ==========================================
    // НОВОЕ — ДОБАВЛЯЕМ
    // ==========================================

    // JWT (web авторизация)
    if (authType === 'Bearer' && !authData?.startsWith('dev:')) {
        return this.authService.validateJwt(request, authData);
    }

    // MAX initData
    if (authType === 'max') {
        return this.authService.validateMaxInitData(request, authData);
    }

    throw new UnauthorizedException('Unknown auth type');
}
```

**auth.service.ts — новые методы:**

```typescript
// JWT валидация (web)
async validateJwt(req: Request, token: string): Promise<boolean> {
    const payload = this.jwtService.verify(token);
    const user = await this.userIdentityService.findByPlatform('web', payload.sub);
    if (!user) throw new UnauthorizedException('User not found');
    req.user = user;
    return true;
}

// JWT выдача (логин)
async login(email: string, password: string): Promise<{ token: string; user: User }> {
    // валидация email + password (bcrypt)
    // поиск через UserIdentity
    // генерация JWT
}

// MAX валидация
async validateMaxInitData(req: Request, initData: string): Promise<boolean> {
    // SDK валидация (аналогично Telegram)
    // поиск через UserIdentity('max', userId)
}
```

**Новые эндпоинты:**

```
POST /auth/login              — email + пароль → JWT
POST /auth/register           — регистрация web-юзера
POST /auth/yandex/callback    — Яндекс ID OAuth → JWT
POST /auth/magic-link         — отправка magic link
GET  /auth/verify?token=      — верификация magic link → JWT
POST /auth/refresh            — обновление JWT
```

**Что это даёт:**

- Web-юзеры входят через JWT
- Telegram продолжает ходить через `tma`
- MAX подключается через `max`
- Все стратегии ведут к одному `req.user` — сервисы не меняются

**Риск:** низкий — добавляем код, не меняем существующий. Telegram `if` остаётся первым.

## Шаг 4 — Очереди (Bull/BullMQ)

**Что:** добавляем очереди для новых процессов, не трогая старые.

**Архитектура:**

```
Контроллер → Сервис → Очередь (Bull) → Процессор
                                          ├── Отправка email
                                          ├── Уведомление в Telegram бот
                                          ├── Синхронизация МойСклад
                                          └── Аналитика
```

**Очереди для новых фич:**

```typescript
// Модуль очередей
@Module({
    imports: [
        BullModule.forRoot({ connection: { host: 'localhost', port: 6379 } }),
        BullModule.registerQueue(
            { name: 'email' },           // magic link, подтверждения, уведомления
            { name: 'notifications' },    // push, telegram bot, in-app
            { name: 'moysklad-sync' },    // фоновая синхронизация (вместо polling)
        ),
    ],
})
```

**Пример — email очередь:**

```typescript
// email.producer.ts
@Injectable()
export class EmailProducer {
    constructor(@InjectQueue('email') private queue: Queue) {}

    async sendMagicLink(email: string, token: string) {
        await this.queue.add(
            'magic-link',
            { email, token },
            {
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }
}

// email.processor.ts
@Processor('email')
export class EmailProcessor {
    @Process('magic-link')
    async handleMagicLink(job: Job<{ email: string; token: string }>) {
        // отправка через SMTP / SendPulse / etc
    }
}
```

**Что это даёт:**

- Retry с экспоненциальным backoff
- Асинхронная обработка (контроллер отвечает сразу)
- Мониторинг через Bull Board
- Постепенно переключаем старые синхронные вызовы

**Риск:** 0 — новые модули, старый код не трогаем. Переключаем постепенно.

## Шаг 5 — Тесты

**Покрываем только то, что трогаем/добавляем:**

| Модуль           | Что тестируем                                       |
| ---------------- | --------------------------------------------------- |
| **UserIdentity** | findByPlatform, linkIdentity, дубликаты             |
| **Auth JWT**     | login, валидация токена, истёкший токен, невалидный |
| **Auth Guard**   | роутинг по authType (tma/Bearer/max/dev)            |
| **Email Queue**  | magic link создаётся, retry работает                |
| **Регистрация**  | web-юзер создаётся с UUID + UserIdentity            |

**Не пишем тестов на:**

- Существующий рабочий код (МойСклад, платежи, чат) — он в проде, работает
- Если потом трогаем — тогда покрываем

## Порядок работы

```
Неделя 1:
├── Шаг 1: миграция UUID колонки (1 день)
├── Шаг 2: UserIdentity таблица + сервис + тесты (2 дня)
└── Шаг 5: тесты на UserIdentity

Неделя 2:
├── Шаг 3: JWT стратегия в auth.guard (2-3 дня)
├── Шаг 3: POST /auth/login + /auth/register (2 дня)
└── Шаг 5: тесты на auth

Неделя 3:
├── Шаг 3: OAuth Яндекс ID + magic link (3 дня)
├── Шаг 4: Bull очереди для email (2 дня)
└── Шаг 5: тесты

Неделя 4:
├── Шаг 3: MAX авторизация (1-2 дня)
├── Интеграция с фронтом
└── Тестирование полного флоу
```

## Чеклист безопасности

На **каждом** шаге перед мержем в main:

- [ ] Telegram Mini App авторизация работает
- [ ] Существующие заказы доступны
- [ ] Каталог отдаёт товары
- [ ] Корзина работает
- [ ] Бот отправляет уведомления
- [ ] GDPR удаление пользователя работает

## Откат

Каждый шаг откатывается независимо:

| Шаг | Откат                                               |
| --- | --------------------------------------------------- |
| 1   | `ALTER TABLE "user" DROP COLUMN "uuid"`             |
| 2   | `DROP TABLE user_identity`                          |
| 3   | Удалить новые `if` в guard, удалить новые эндпоинты |
| 4   | Удалить Bull модули, Redis очереди очищаются сами   |

## Связанные документы

- `docs/features/AUTH_ADAPTER.md` — фронтенд Adapter Pattern
- `docs/multi-platform/MIGRATION_PLAN.md` (в crm-aqua-kinetics-back) — полный план миграции
