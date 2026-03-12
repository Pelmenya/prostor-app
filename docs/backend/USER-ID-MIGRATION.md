# Проблема User ID в backend и решение для мультиплатформенности

> Дата: 2025-12-23
> Статус: 🔴 Критическая проблема
> Приоритет: Высокий

## Содержание

- [Описание проблемы](#описание-проблемы)
- [Текущая реализация](#текущая-реализация)
- [Почему это проблема](#почему-это-проблема)
- [Варианты решения](#варианты-решения)
- [Рекомендуемое решение](#рекомендуемое-решение)
- [План миграции](#план-миграции)
- [Код миграции](#код-миграции)

---

## Описание проблемы

**Текущая ситуация:**
В backend сущности `User` используется `Telegram ID` как `@PrimaryColumn`:

```typescript
@Entity()
export class User {
    @PrimaryColumn({ type: 'bigint' }) // Id как в Telegram
    id: number;
    // ...
}
```

**Проблема:**
При миграции на MAX, Web или другие платформы у пользователей будут **другие идентификаторы**, что делает невозможным использование одной БД для разных платформ.

---

## Текущая реализация

### User Entity

**Файл:** `src/modules/user/user.entity.ts`

```typescript
@Entity()
export class User {
    @PrimaryColumn({ type: 'bigint' })
    id: number; // ← Telegram user ID

    @Column({ nullable: true })
    allows_write_to_pm: boolean;

    @Column({ nullable: true })
    first_name: string;

    @Column({ nullable: true })
    last_name: string;

    @Column({ nullable: true })
    username: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENT })
    role: UserRole;

    // ... остальные поля
}
```

### Связи с User

**Найдено 8 сущностей, связанных с User:**

1. **Order** - `client`, `executor` (ManyToOne)
2. **RealEstate** - `user` (ManyToOne)
3. **Cart** - `user` (OneToOne)
4. **AccountService** - `user` (OneToOne)
5. **UserConsent** - `user` (ManyToOne)
6. **Counterparty** - `user` (ManyToOne)
7. **OrderFeedback** - `user` (ManyToOne)
8. **User** - `realEstate`, `accountService`, `cart`, `consents` (OneToMany/OneToOne)

**Пример связи (Order):**
```typescript
@ManyToOne(() => User, { nullable: false })
@JoinColumn()
client: User; // ← Использует User.id (Telegram ID)
```

---

## Почему это проблема

### Сценарий 1: Пользователь из Telegram регистрируется в MAX

```
User in Telegram: id = 123456789
User in MAX:      id = 987654321 (другой ID!)
```

**Проблема:** Система создаст **двух разных пользователей** для одного человека.

**Последствия:**
- ❌ Разные профили
- ❌ Разные корзины
- ❌ Разная недвижимость
- ❌ Разные заказы
- ❌ Невозможно объединить историю

### Сценарий 2: Пользователь из Web (нет Telegram/MAX ID)

```
User in Web: id = ??? (нет messenger ID вообще)
```

**Проблема:** Как генерировать ID?

**Варианты (все плохие):**
- ❌ Случайное число - коллизии с реальными Telegram ID
- ❌ Использовать email hash - не уникально
- ❌ Использовать phone hash - не уникально

### Сценарий 3: Миграция существующих пользователей

```
Telegram users: 1000 пользователей с реальными Telegram ID
MAX users:      как их идентифицировать?
```

**Проблема:** Нельзя изменить Primary Key без полной перестройки БД.

---

## Варианты решения

### Вариант 1: UUID как Primary Key (РЕКОМЕНДУЕТСЯ) ⭐

**Идея:** Использовать UUID как основной идентификатор, messenger ID хранить отдельно.

**Структура:**
```typescript
@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string; // ← Универсальный UUID

    @Column({ type: 'varchar', length: 50, nullable: true })
    platform: 'telegram' | 'max' | 'web'; // Платформа регистрации

    @Column({ type: 'bigint', nullable: true, unique: true })
    telegramId: number; // Telegram user ID

    @Column({ type: 'bigint', nullable: true, unique: true })
    maxId: number; // MAX user ID

    @Column({ nullable: true, unique: true })
    email: string; // Для Web

    @Column({ nullable: true, unique: true })
    phone: string; // Для всех платформ

    // ... остальные поля
}
```

**Преимущества:**
- ✅ Поддержка всех платформ
- ✅ Уникальность гарантирована
- ✅ Можно связать аккаунты (один пользователь - несколько платформ)
- ✅ Стандартный подход в индустрии

**Недостатки:**
- 🔴 Требует миграции БД
- 🔴 Изменение всех связанных таблиц
- 🟡 UUID занимает больше места чем bigint

---

### Вариант 2: Composite Key

**Идея:** Комбинация (platform + platformUserId)

```typescript
@Entity()
export class User {
    @PrimaryColumn({ type: 'varchar', length: 50 })
    platform: 'telegram' | 'max' | 'web';

    @PrimaryColumn({ type: 'bigint' })
    platformUserId: number;

    // ... остальные поля
}
```

**Преимущества:**
- ✅ Поддержка всех платформ
- ✅ Не требует UUID

**Недостатки:**
- 🔴 Сложные JOIN запросы
- 🔴 Нельзя объединить аккаунты с разных платформ
- 🔴 Composite keys неудобны в TypeORM

---

### Вариант 3: Sequence Primary Key + messenger IDs

**Идея:** Auto-increment ID + отдельные поля для messenger ID

```typescript
@Entity()
export class User {
    @PrimaryGeneratedColumn({ type: 'int' })
    id: number; // ← Auto-increment

    @Column({ type: 'bigint', nullable: true, unique: true })
    telegramId: number;

    @Column({ type: 'bigint', nullable: true, unique: true })
    maxId: number;

    // ... остальные поля
}
```

**Преимущества:**
- ✅ Поддержка всех платформ
- ✅ Простые числовые ID
- ✅ Меньше места чем UUID

**Недостатки:**
- 🔴 Требует миграции БД
- 🟡 Потенциальные проблемы при merge БД
- 🟡 Меньше распределенности чем UUID

---

### Вариант 4: Adapter с ID mapping (временное решение)

**Идея:** Создать mapping таблицу для конвертации messenger ID → internal ID

```typescript
@Entity()
export class UserIdentity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number; // FK to User.id (Telegram ID)

    @Column({ type: 'varchar', length: 50 })
    platform: 'telegram' | 'max' | 'web';

    @Column({ type: 'varchar', length: 100, unique: true })
    externalId: string; // ID на платформе

    @CreateDateColumn()
    createdAt: Date;
}
```

**Использование:**
```typescript
// При аутентификации из MAX
const identity = await UserIdentity.findOne({
    platform: 'max',
    externalId: maxUserId.toString(),
});

const user = identity
    ? await User.findOne(identity.userId)
    : await createUserFromMax(maxUserId);
```

**Преимущества:**
- ✅ Не требует миграции основной таблицы User
- ✅ Постепенная миграция возможна
- ✅ Можно связать аккаунты

**Недостатки:**
- 🔴 Дополнительный JOIN на каждом запросе
- 🔴 Усложнение архитектуры
- 🟡 Временное решение, все равно нужна миграция

---

## Рекомендуемое решение

### Выбор: Вариант 1 (UUID) + Вариант 4 (временный adapter)

**Стратегия:**

**Фаза 1 (быстрая): UserIdentity adapter** ← Для MAX миграции
- Создаем таблицу `UserIdentity`
- Заполняем для существующих Telegram пользователей
- Используем для MAX аутентификации

**Фаза 2 (долгосрочная): UUID миграция** ← После успешного запуска MAX
- Добавляем UUID колонку в User
- Генерируем UUID для существующих пользователей
- Постепенно мигрируем связанные таблицы
- Переключаем Primary Key на UUID

---

## План миграции

### Фаза 1: UserIdentity (1-2 недели)

#### Шаг 1: Создать entity

```typescript
// src/modules/user-identity/user-identity.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { User } from '../user/user.entity';

export enum Platform {
    TELEGRAM = 'telegram',
    MAX = 'max',
    WEB = 'web',
    VK = 'vk',
}

@Entity()
@Unique(['platform', 'externalId']) // Уникальность по платформе + external ID
export class UserIdentity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index('idx_user_identity_user_id')
    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @Column({ type: 'bigint' })
    userId: number; // Для быстрых запросов без JOIN

    @Index('idx_user_identity_platform')
    @Column({
        type: 'enum',
        enum: Platform,
    })
    platform: Platform;

    @Index('idx_user_identity_external_id')
    @Column({ type: 'varchar', length: 100 })
    externalId: string; // ID на внешней платформе (Telegram, MAX, etc)

    @Column({ type: 'boolean', default: true })
    isPrimary: boolean; // Основная платформа для этого пользователя

    @Column({ type: 'timestamp', nullable: true })
    lastUsedAt: Date; // Когда последний раз использовался этот identity

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
}
```

#### Шаг 2: Создать migration

```typescript
// src/migrations/XXXXXX-create-user-identity.ts

import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateUserIdentity1234567890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Создаем таблицу
        await queryRunner.createTable(
            new Table({
                name: 'user_identity',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'userId',
                        type: 'bigint',
                    },
                    {
                        name: 'platform',
                        type: 'enum',
                        enum: ['telegram', 'max', 'web', 'vk'],
                    },
                    {
                        name: 'externalId',
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: 'isPrimary',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'lastUsedAt',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Добавляем индексы
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_identity_platform_external_id"
            ON "user_identity" ("platform", "externalId")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_user_identity_user_id"
            ON "user_identity" ("userId")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_user_identity_platform"
            ON "user_identity" ("platform")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_user_identity_external_id"
            ON "user_identity" ("externalId")
        `);

        // Добавляем foreign key
        await queryRunner.createForeignKey(
            'user_identity',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'user',
                onDelete: 'CASCADE',
            }),
        );

        // Мигрируем существующих Telegram пользователей
        await queryRunner.query(`
            INSERT INTO "user_identity" ("userId", "platform", "externalId", "isPrimary", "createdAt")
            SELECT
                id,
                'telegram',
                CAST(id AS VARCHAR),
                true,
                created_at
            FROM "user"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('user_identity');
    }
}
```

#### Шаг 3: Создать service

```typescript
// src/modules/user-identity/user-identity.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserIdentity, Platform } from './user-identity.entity';
import { User } from '../user/user.entity';

@Injectable()
export class UserIdentityService {
    constructor(
        @InjectRepository(UserIdentity)
        private userIdentityRepository: Repository<UserIdentity>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    /**
     * Найти пользователя по платформе и external ID
     */
    async findUserByPlatformId(
        platform: Platform,
        externalId: string,
    ): Promise<User | null> {
        const identity = await this.userIdentityRepository.findOne({
            where: { platform, externalId },
            relations: ['user'],
        });

        if (identity) {
            // Обновляем lastUsedAt
            await this.userIdentityRepository.update(identity.id, {
                lastUsedAt: new Date(),
            });
        }

        return identity?.user || null;
    }

    /**
     * Создать identity для пользователя
     */
    async createIdentity(
        userId: number,
        platform: Platform,
        externalId: string,
        isPrimary = false,
    ): Promise<UserIdentity> {
        const identity = this.userIdentityRepository.create({
            userId,
            platform,
            externalId,
            isPrimary,
            lastUsedAt: new Date(),
        });

        return this.userIdentityRepository.save(identity);
    }

    /**
     * Связать существующего пользователя с новой платформой
     */
    async linkPlatform(
        userId: number,
        platform: Platform,
        externalId: string,
    ): Promise<UserIdentity> {
        // Проверяем, не привязан ли уже этот externalId к другому пользователю
        const existing = await this.userIdentityRepository.findOne({
            where: { platform, externalId },
        });

        if (existing && existing.userId !== userId) {
            throw new Error(
                `This ${platform} account is already linked to another user`,
            );
        }

        if (existing) {
            // Уже привязан к этому пользователю
            return existing;
        }

        // Создаем новую связь
        return this.createIdentity(userId, platform, externalId, false);
    }

    /**
     * Получить все платформы пользователя
     */
    async getUserIdentities(userId: number): Promise<UserIdentity[]> {
        return this.userIdentityRepository.find({
            where: { userId },
            order: { isPrimary: 'DESC', createdAt: 'ASC' },
        });
    }

    /**
     * Проверить, может ли external ID быть использован
     */
    async isExternalIdAvailable(
        platform: Platform,
        externalId: string,
    ): Promise<boolean> {
        const count = await this.userIdentityRepository.count({
            where: { platform, externalId },
        });

        return count === 0;
    }
}
```

#### Шаг 4: Обновить auth logic

```typescript
// src/modules/auth/auth.service.ts (обновления)

import { UserIdentityService } from '../user-identity/user-identity.service';
import { Platform } from '../user-identity/user-identity.entity';

@Injectable()
export class AuthService {
    constructor(
        // ... другие dependencies
        private userIdentityService: UserIdentityService,
    ) {}

    /**
     * Аутентификация пользователя через Telegram
     */
    async authenticateTelegram(telegramId: number, userData: any): Promise<User> {
        // Ищем пользователя через UserIdentity
        let user = await this.userIdentityService.findUserByPlatformId(
            Platform.TELEGRAM,
            telegramId.toString(),
        );

        if (!user) {
            // Создаем нового пользователя
            user = await this.userRepository.save({
                id: telegramId, // Пока используем Telegram ID
                ...userData,
            });

            // Создаем identity
            await this.userIdentityService.createIdentity(
                user.id,
                Platform.TELEGRAM,
                telegramId.toString(),
                true, // primary
            );
        }

        return user;
    }

    /**
     * Аутентификация пользователя через MAX
     */
    async authenticateMax(maxId: number, userData: any): Promise<User> {
        // Ищем пользователя через UserIdentity
        let user = await this.userIdentityService.findUserByPlatformId(
            Platform.MAX,
            maxId.toString(),
        );

        if (!user) {
            // Проверяем, может быть это существующий пользователь (по phone/email)
            user = await this.findExistingUserByContact(
                userData.phone,
                userData.email,
            );

            if (user) {
                // Связываем с MAX
                await this.userIdentityService.linkPlatform(
                    user.id,
                    Platform.MAX,
                    maxId.toString(),
                );
            } else {
                // Создаем нового пользователя
                // ВАЖНО: генерируем уникальный ID (не MAX ID!)
                user = await this.userRepository.save({
                    id: await this.generateUniqueUserId(), // Временно
                    ...userData,
                });

                // Создаем identity
                await this.userIdentityService.createIdentity(
                    user.id,
                    Platform.MAX,
                    maxId.toString(),
                    true,
                );
            }
        }

        return user;
    }

    /**
     * Временное решение: генерация уникального ID
     * TODO: заменить на UUID в фазе 2
     */
    private async generateUniqueUserId(): Promise<number> {
        // Используем высокие числа чтобы не пересекаться с Telegram ID
        const PREFIX = 9000000000; // 9 billion
        const randomSuffix = Math.floor(Math.random() * 999999999);
        const candidateId = PREFIX + randomSuffix;

        // Проверяем уникальность
        const exists = await this.userRepository.findOne({
            where: { id: candidateId },
        });

        if (exists) {
            // Рекурсивно пробуем снова
            return this.generateUniqueUserId();
        }

        return candidateId;
    }

    /**
     * Поиск существующего пользователя по контактным данным
     */
    private async findExistingUserByContact(
        phone?: string,
        email?: string,
    ): Promise<User | null> {
        if (phone) {
            const user = await this.userRepository.findOne({ where: { phone } });
            if (user) return user;
        }

        if (email) {
            const user = await this.userRepository.findOne({ where: { email } });
            if (user) return user;
        }

        return null;
    }
}
```

---

### Фаза 2: UUID Migration (2-4 недели, после успешного MAX релиза)

Детальный план будет создан отдельно после завершения Фазы 1.

**Общий подход:**
1. Добавить `uuid` колонку в `User` (nullable)
2. Сгенерировать UUID для существующих записей
3. Обновить все FK в связанных таблицах
4. Переключить Primary Key на UUID
5. Удалить старую `id` колонку

---

## Выводы

### Критичность проблемы

🔴 **ВЫСОКАЯ** - блокирует мультиплатформенность

### Рекомендуемые действия

1. ✅ **Немедленно:** Реализовать UserIdentity (Фаза 1) перед MAX миграцией
2. 🟡 **Короткий срок:** Протестировать на dev окружении
3. ⏳ **Средний срок:** Запланировать UUID миграцию (Фаза 2)

### Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Потеря данных при миграции | Низкая | Критическое | Полный backup, тестирование на копии БД |
| Performance degradation | Средняя | Среднее | Правильные индексы, тестирование нагрузки |
| Конфликты ID при генерации | Низкая | Высокое | Использовать высокий prefix (9B+) |
| Двойные аккаунты | Средняя | Среднее | Поиск по phone/email, UI для связывания |

---

**Дата последнего обновления:** 2025-12-23
**Автор:** Claude Code
**Статус:** 🔴 Требует немедленного внимания перед MAX миграцией
