# Роль MANAGER — B2B менеджер объектов

## Обзор

MANAGER — новая роль для B2B-сегмента. Менеджер представляет коммерческие объекты (кафе, фитнес-клубы, медцентры и др.) и управляет для них заказами на обслуживание водоочистного оборудования.

**Ключевые отличия от других ролей:**

| Аспект                | CLIENT        | MANAGER                    | CURATOR                |
| --------------------- | ------------- | -------------------------- | ---------------------- |
| Управляет объектами   | Только своими | Своими + клиентских B2B    | Видит всё              |
| Создаёт заказы        | За себя       | За себя (для B2B объектов) | Не создаёт             |
| Управляет мастерами   | Нет           | Нет                        | Да                     |
| Переназначает объекты | Нет           | Нет                        | Да (между менеджерами) |
| Меняет роли           | Нет           | Нет                        | Да                     |
| Сегмент               | B2C           | B2B                        | Операционный           |

---

## Иерархия ролей (обновлённая)

```
ADMIN
  └── CURATOR         — назначает роли, управляет менеджерами, переносит объекты
        └── MANAGER   — управляет B2B объектами, создаёт заказы
CLIENT               — конечный пользователь, может иметь менеджера на объекте
SERVICE              — мастер-монтажник, независимо от иерархии
```

---

## Жизненный цикл менеджера

```
Пользователь регистрируется как CLIENT
           ↓
Куратор открывает карточку клиента → меняет роль на MANAGER
           ↓
Менеджер попадает в кабинет /dashboard/manager/
           ↓
Создаёт B2B объекты, добавляет их на карту, создаёт заказы
```

> Самостоятельная регистрация с ролью MANAGER **не предусмотрена**. Роль выдаётся только куратором или администратором через карточку клиента. Архитектурно заложить возможность для будущей самостоятельной заявки на роль (например, форма запроса).

---

## B2B типы объектов

Новый enum `EBusinessType`. При создании объекта менеджером тип **обязателен**.

```typescript
export enum EBusinessType {
    FITNESS = 'fitness', // фитнес-клуб / спортзал
    MEDICAL = 'medical', // медицинский центр / клиника
    BAKERY = 'bakery', // пекарня / кофейня
    RESTAURANT = 'restaurant', // ресторан / кафе / столовая
    WATER_POINT = 'water_point', // водомат / точка розлива воды
    CAR_WASH = 'car_wash', // автомойка
    PUBLIC = 'public_space', // общественное пространство (библиотека, коворкинг)
}

export const BUSINESS_TYPE_LABELS: Record<EBusinessType, string> = {
    [EBusinessType.FITNESS]: 'Фитнес-клуб',
    [EBusinessType.MEDICAL]: 'Медицинский центр',
    [EBusinessType.BAKERY]: 'Пекарня / Кофейня',
    [EBusinessType.RESTAURANT]: 'Ресторан / Кафе',
    [EBusinessType.WATER_POINT]: 'Водомат',
    [EBusinessType.CAR_WASH]: 'Автомойка',
    [EBusinessType.PUBLIC]: 'Общественное пространство',
};
```

> Список расширяется по запросу продукта — только правка enum, без структурных изменений в БД и коде.

---

## Флаг публичности объекта

Каждый B2B объект имеет поле `isPublic: boolean` (по умолчанию `false`).

| `isPublic` | Видит менеджер | Видит куратор | Видит сообщество (карта) |
| ---------- | -------------- | ------------- | ------------------------ |
| `false`    | ✅             | ✅            | ❌                       |
| `true`     | ✅             | ✅            | ✅                       |

**Публичная карта** — страница `/water-map` в `(web)` layout без авторизации. Показывает все B2B объекты с `isPublic = true`. Позиционирование: «Точки чистой воды в городе» — для сообщества пользователей.

Переключает флаг сам менеджер через свой кабинет. Куратор тоже может переключить.

---

## Модель данных

### Изменения в `RealEstate` (бэкенд)

Добавляются новые поля в существующую таблицу. Всё остальное без изменений.

```typescript
// Добавить в real-estate.entity.ts (TypeORM)

@Column({ type: 'varchar', nullable: true })
name: string | null;                  // название объекта ("Кофейня Уют") — обязателен для B2B

@Column({ type: 'enum', enum: BusinessType, nullable: true })
businessType: EBusinessType | null;   // null для жилых объектов CLIENT

@Column({ default: false })
isPublic: boolean;                    // флаг публичной карты

// Контакты объекта (опциональные, для публичной карты и менеджера)
@Column({ nullable: true })
contactPhone: string | null;

@Column({ nullable: true })
contactEmail: string | null;

@Column({ type: 'jsonb', nullable: true })
socials: TObjectSocials | null;       // { vk?, telegram?, website? }

@ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
manager: User | null;                 // менеджер, управляющий объектом

@Column({ nullable: true })
managerId: number | null;
```

**Ограничения:**

- `name` — обязателен при создании/обновлении объекта с `businessType != null`
- `businessType` — обязателен при создании объекта менеджером
- `businessType` — null для жилых объектов CLIENT (существующая логика не ломается)
- `managerId` — null для объектов обычных клиентов без менеджера
- `isPublic = true` допустим только при `businessType != null`

### Тип для соцсетей

```typescript
// src/shared/model/t-object-contacts.ts
export type TObjectSocials = {
    vk?: string;
    telegram?: string;
    website?: string;
};

export type TObjectContacts = {
    phone?: string | null;
    email?: string | null;
    socials?: TObjectSocials | null;
};
```

### Изменения в `User` (бэкенд)

```typescript
// user.entity.ts — добавить в enum UserRole
export enum UserRole {
    CLIENT = 'client',
    SERVICE = 'service',
    CURATOR = 'curator',
    MANAGER = 'manager', // ← новая роль
    ADMIN = 'admin',
}
```

### Связь CLIENT ↔ MANAGER через объект

Клиент (CLIENT) может создать B2B объект самостоятельно (например, кафе как `activeType: 'prom'`). Куратор в любой момент может прикрепить этот объект к менеджеру — через `PATCH /curator/objects/:id/manager`. После этого менеджер видит объект в своём кабинете и может заказывать обслуживание.

---

## Миграция базы данных (бэкенд)

```sql
-- 1. Enum для типов B2B объектов
CREATE TYPE business_type AS ENUM (
    'fitness', 'medical', 'bakery', 'restaurant', 'water_point', 'car_wash', 'public_space'
);

-- 2. Новые колонки в real_estate
ALTER TABLE real_estate
    ADD COLUMN name           VARCHAR,
    ADD COLUMN business_type  business_type,
    ADD COLUMN is_public      BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN contact_phone  VARCHAR,
    ADD COLUMN contact_email  VARCHAR,
    ADD COLUMN socials        JSONB,
    ADD COLUMN manager_id     INT REFERENCES users(id) ON DELETE SET NULL;

-- 3. Индекс для запросов "все объекты менеджера"
CREATE INDEX idx_real_estate_manager_id ON real_estate(manager_id);

-- 4. Индекс для публичной карты
CREATE INDEX idx_real_estate_is_public ON real_estate(is_public) WHERE is_public = TRUE;

-- 5. MANAGER в enum ролей (если role — enum тип в PG)
ALTER TYPE user_role ADD VALUE 'manager';
```

---

## Бэкенд — новый модуль `manager`

### Структура модуля

```
src/modules/manager/
├── manager.module.ts
├── manager.controller.ts
├── manager.service.ts
├── manager.guard.ts               — проверяет роль MANAGER
├── dto/
│   ├── create-b2b-object.dto.ts
│   ├── update-b2b-object.dto.ts
│   └── toggle-visibility.dto.ts
└── manager.service.spec.ts
```

### Guard

```typescript
// manager.guard.ts
@Injectable()
export class ManagerGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const user = context.switchToHttp().getRequest().user;
        return user?.role === UserRole.MANAGER;
    }
}
```

---

## API эндпоинты

### Кабинет менеджера (`/manager/*`)

Все эндпоинты требуют `Authorization: Bearer <jwt>` + роль `MANAGER`.

```
# Профиль
GET    /manager/profile
PATCH  /manager/profile                         — имя, фамилия, телефон

# Объекты (все объекты где managerId = текущий менеджер)
GET    /manager/objects                          — список с пагинацией и фильтром по businessType
GET    /manager/objects/:id                      — детали + оборудование + история заказов
POST   /manager/objects                          — создать B2B объект
PATCH  /manager/objects/:id                      — редактировать объект
DELETE /manager/objects/:id                      — удалить объект

# Переключение публичности
PATCH  /manager/objects/:id/visibility           — { isPublic: boolean }

# Заказы (создаются от имени менеджера как клиента, на B2B объект)
GET    /manager/orders                           — все заказы с фильтром по objectId/статусу
GET    /manager/orders/:id                       — заказ детально
POST   /manager/orders                           — создать заказ (realEstateId = B2B объект)
```

### Расширение модуля куратора (`/curator/*`)

```
# Управление менеджерами — новые эндпоинты
GET    /curator/managers                         — список менеджеров с их объектами (count)
GET    /curator/managers/:id                     — менеджер детально + список его объектов
PATCH  /curator/managers/:id/profile             — редактировать профиль менеджера

# B2B объекты — новые эндпоинты
GET    /curator/b2b-objects                      — все B2B объекты системы (фильтр: тип/менеджер/публичность)
PATCH  /curator/b2b-objects/:objectId/manager    — { managerId: number | null } переназначить менеджера
PATCH  /curator/b2b-objects/:objectId/visibility — куратор тоже может менять isPublic

# Управление ролями пользователей — НОВЫЙ функционал куратора
PATCH  /curator/users/:userId/role               — { role: 'manager' | 'service' | 'client' }
# Куратор может назначать/снимать роли: CLIENT → MANAGER, CLIENT → SERVICE, MANAGER → CLIENT
# CURATOR и ADMIN — только через панель администратора
```

> `POST /curator/managers` убран — менеджер создаётся через смену роли (`PATCH /curator/users/:userId/role`), а не отдельным созданием. Пользователь сам регистрируется как CLIENT, куратор меняет роль.

### Публичная карта (без авторизации)

```
GET    /public/water-points
# Query params:
#   type=fitness,restaurant,car_wash   — фильтр по типу (через запятую)
#   bbox=lng1,lat1,lng2,lat2           — ограничивающий прямоугольник карты
# Возвращает: id, name, address, coordinates, businessType, contactPhone?, socials?
```

### Обновлённый DTO создания B2B объекта

```typescript
// create-b2b-object.dto.ts
export class CreateB2bObjectDto {
    @IsString()
    @MinLength(2)
    name: string; // обязательно — название заведения

    @IsEnum(EBusinessType)
    businessType: EBusinessType; // обязательно — тип B2B объекта

    @IsString()
    address: string;

    @IsOptional()
    @IsObject()
    geoData?: Record<string, unknown>;

    @IsOptional()
    @IsObject()
    suggestion?: Record<string, unknown>;

    @IsOptional()
    coordinates?: { type: 'Point'; coordinates: [number, number] };

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean; // default false

    // Контакты объекта (для публичной карты)
    @IsOptional()
    @IsString()
    contactPhone?: string;

    @IsOptional()
    @IsEmail()
    contactEmail?: string;

    @IsOptional()
    @IsObject()
    socials?: TObjectSocials; // { instagram?, vk?, telegram?, website? }

    // Технические поля воды — те же что у жилых объектов
    @IsEnum(['borehole', 'well', 'reservoir', 'waterSupply'])
    activeSource: TRealEstateSourceWater;

    @IsOptional()
    @IsNumber()
    depthWaterSource?: number;

    @IsObject()
    waterIntakePoints: TWaterIntakePoints;
}
```

### Обновлённый DTO смены роли (куратор)

```typescript
// change-user-role.dto.ts
export class ChangeUserRoleDto {
    @IsEnum([UserRole.CLIENT, UserRole.MANAGER, UserRole.SERVICE])
    role: UserRole.CLIENT | UserRole.MANAGER | UserRole.SERVICE;
    // CURATOR и ADMIN — нельзя назначить через этот эндпоинт
}
```

---

## Фронтенд

### 1. Изменения в `shared/model/`

**`src/shared/model/t-user.ts`** — добавить роль:

```typescript
export enum EUserRole {
    CLIENT = 'client',
    SERVICE = 'service',
    CURATOR = 'curator',
    MANAGER = 'manager', // ← добавить
    ADMIN = 'admin',
}
```

**`src/shared/model/t-real-estate.ts`** — расширить:

```typescript
export enum EBusinessType {
    FITNESS = 'fitness',
    MEDICAL = 'medical',
    BAKERY = 'bakery',
    RESTAURANT = 'restaurant',
    WATER_POINT = 'water_point',
    CAR_WASH = 'car_wash',
    PUBLIC = 'public_space',
}

export const BUSINESS_TYPE_LABELS: Record<EBusinessType, string> = {
    [EBusinessType.FITNESS]: 'Фитнес-клуб',
    [EBusinessType.MEDICAL]: 'Медицинский центр',
    [EBusinessType.BAKERY]: 'Пекарня / Кофейня',
    [EBusinessType.RESTAURANT]: 'Ресторан / Кафе',
    [EBusinessType.WATER_POINT]: 'Водомат',
    [EBusinessType.CAR_WASH]: 'Автомойка',
    [EBusinessType.PUBLIC]: 'Общественное пространство',
};

// Расширение TRealEstate
export type TRealEstate = {
    id: number;
    address: string;
    geoData: Record<string, unknown> | null;
    suggestion: Record<string, unknown> | null;
    coordinates: TGeoJSONPoint | null;
    activeType: TRealEstateType;
    residents: number;
    activeSource: TRealEstateSourceWater;
    depthWaterSource?: number;
    waterIntakePoints: TWaterIntakePoints;
    // ↓ новые поля
    name: string | null;
    businessType: EBusinessType | null;
    isPublic: boolean;
    contactPhone: string | null;
    contactEmail: string | null;
    socials: TObjectSocials | null;
    managerId: number | null;
    created_at: string;
    updated_at: string;
};
```

**`src/shared/model/t-object-contacts.ts`** — новый файл:

```typescript
export type TObjectSocials = {
    instagram?: string;
    vk?: string;
    telegram?: string;
    website?: string;
};
```

**`src/shared/model/t-manager.ts`** — новый файл:

```typescript
export type TB2bObject = TRealEstate & {
    businessType: EBusinessType; // никогда не null для B2B
    name: string; // никогда не null для B2B
    orderCount?: number;
    lastOrderAt?: string;
};

export type TManagerProfile = TUser & {
    role: EUserRole.MANAGER;
    objectsCount: number;
};

export type TPublicWaterPoint = {
    id: number;
    name: string;
    address: string;
    coordinates: TGeoJSONPoint;
    businessType: EBusinessType;
    contactPhone?: string;
    socials?: TObjectSocials;
};
```

### 2. Новые API хуки

**`src/entities/real-estate/api/manager-objects.api.ts`**:

```typescript
useManagerObjects(filters?)         — GET /manager/objects
useManagerObject(id)                — GET /manager/objects/:id
useCreateManagerObject()            — POST /manager/objects
useUpdateManagerObject()            — PATCH /manager/objects/:id
useDeleteManagerObject()            — DELETE /manager/objects/:id
useToggleObjectVisibility()         — PATCH /manager/objects/:id/visibility
useManagerOrders(filters?)          — GET /manager/orders
useManagerOrder(id)                 — GET /manager/orders/:id
useCreateManagerOrder()             — POST /manager/orders
```

**`src/entities/user/api/curator-managers.api.ts`** (новый файл, отдельно от curator-users):

```typescript
useGetManagers(filters?)            — GET /curator/managers
useGetManager(id)                   — GET /curator/managers/:id
useUpdateManagerProfile()           — PATCH /curator/managers/:id/profile
useReassignObject()                 — PATCH /curator/b2b-objects/:id/manager
useGetCuratorB2bObjects(filters?)   — GET /curator/b2b-objects
useToggleCuratorObjectVisibility()  — PATCH /curator/b2b-objects/:id/visibility
useChangeUserRole()                 — PATCH /curator/users/:id/role  ← НОВЫЙ хук
```

**`src/entities/real-estate/api/public-water-points.api.ts`**:

```typescript
usePublicWaterPoints(filters?)      — GET /public/water-points (без авторизации)
```

### 3. Dashboard — новые страницы

**Роуты менеджера `src/app/(dashboard)/manager/`:**

```
/manager                           → manager-account (дашборд: объекты + заказы)
/manager/objects                   → manager-objects (список B2B объектов)
/manager/objects/new               → manager-object-form (создание)
/manager/objects/[id]              → manager-object-detail (детали + оборудование)
/manager/objects/[id]/edit         → manager-object-form (редактирование)
/manager/orders                    → manager-orders (заказы по объектам)
/manager/orders/[id]               → manager-order-detail
/manager/profile                   → manager-profile
/manager/settings                  → manager-settings
```

**Новые роуты куратора `src/app/(dashboard)/curator/`:**

```
/curator/managers                  → curator-managers (список менеджеров)
/curator/managers/[id]             → curator-manager-detail (детали + объекты менеджера)
/curator/managers/[id]/edit        → curator-manager-edit
/curator/b2b-objects               → curator-b2b-objects (все B2B объекты системы)
```

**Расширение карточки клиента куратора:**

На странице `/curator/clients/[id]` добавить блок управления ролью:

- Текущая роль клиента (chip/badge)
- Кнопка «Назначить менеджером» → `PATCH /curator/users/:id/role { role: 'manager' }`
- Кнопка «Назначить мастером» → `PATCH /curator/users/:id/role { role: 'service' }`
- Кнопка «Вернуть роль клиента» → `PATCH /curator/users/:id/role { role: 'client' }`
- Если клиент уже MANAGER — показать его B2B объекты в карточке

### 4. FSD структура

```
src/
├── shared/model/
│   ├── t-user.ts                       — + MANAGER в EUserRole
│   ├── t-real-estate.ts                — + EBusinessType, isPublic, name, contacts, managerId
│   ├── t-object-contacts.ts            — TObjectSocials (новый)
│   └── t-manager.ts                    — TB2bObject, TManagerProfile, TPublicWaterPoint (новый)
│
├── entities/
│   ├── real-estate/
│   │   └── api/
│   │       ├── real-estate.api.ts          — без изменений (CLIENT CRUD)
│   │       ├── manager-objects.api.ts      — новый (MANAGER CRUD + orders)
│   │       └── public-water-points.api.ts  — новый (публичная карта)
│   └── user/
│       └── api/
│           ├── curator-users.api.ts        — без изменений
│           └── curator-managers.api.ts     — новый (менеджеры + смена ролей)
│
├── features/
│   ├── manager-access-gate/            — guard для /dashboard/manager/*
│   │   └── ui/manager-access-gate.tsx
│   ├── manager-object-form/            — форма создания/редактирования B2B объекта
│   │   ├── ui/manager-object-form.tsx
│   │   └── model/manager-object-schema.ts  — Zod схема
│   ├── manager-visibility-toggle/      — переключатель isPublic
│   │   └── ui/visibility-toggle.tsx
│   └── curator-role-manager/           — UI смены роли пользователя куратором
│       └── ui/change-user-role.tsx
│
├── views/dashboard/
│   ├── manager-account/
│   ├── manager-objects/
│   ├── manager-object-detail/
│   ├── manager-object-form/
│   ├── manager-orders/
│   ├── manager-order-detail/
│   ├── manager-profile/
│   ├── curator-managers/               — новая страница куратора
│   ├── curator-manager-detail/         — новая страница куратора
│   └── curator-b2b-objects/            — новая страница куратора
│
└── app/(dashboard)/
    ├── manager/
    │   ├── layout.tsx                  — ManagerAccessGate + sidebar
    │   ├── page.tsx                    → ManagerAccountPage
    │   ├── objects/page.tsx            → ManagerObjectsPage
    │   ├── objects/new/page.tsx        → ManagerObjectFormPage
    │   ├── objects/[id]/page.tsx       → ManagerObjectDetailPage
    │   ├── objects/[id]/edit/page.tsx  → ManagerObjectFormPage (edit)
    │   ├── orders/page.tsx             → ManagerOrdersPage
    │   ├── orders/[id]/page.tsx        → ManagerOrderDetailPage
    │   ├── profile/page.tsx            → ManagerProfilePage
    │   └── settings/page.tsx          → ManagerSettingsPage
    └── curator/
        ├── managers/page.tsx           → CuratorManagersPage (новая)
        ├── managers/[id]/page.tsx      → CuratorManagerDetailPage (новая)
        ├── managers/[id]/edit/page.tsx → CuratorManagerEditPage (новая)
        └── b2b-objects/page.tsx        → CuratorB2bObjectsPage (новая)
```

### 5. Расширение карточки куратора (curator-client-detail)

Действующий `views/dashboard/curator-client-detail/` — добавить секцию:

```tsx
// В CuratorClientDetailPage — новый блок
<UserRoleSection
    user={client}
    onChangeRole={(role) => changeUserRole({ userId: client.id, role })}
/>
```

Компонент показывает текущую роль и кнопки смены. После успешной смены — инвалидирует кэш пользователя и перенаправляет на соответствующий раздел.

---

## Права и ограничения

### Что менеджер МОЖЕТ:

- ✅ Создавать B2B объекты (с обязательным `name` и `businessType`)
- ✅ Редактировать свои объекты (адрес, название, контакты, тип воды)
- ✅ Переключать `isPublic` у своих объектов
- ✅ Создавать заказы для своих объектов (заказ создаётся от имени менеджера)
- ✅ Просматривать историю заказов и установленное оборудование по объектам

### Что менеджер НЕ МОЖЕТ:

- ❌ Видеть объекты других менеджеров
- ❌ Переназначать объекты между менеджерами (только куратор)
- ❌ Управлять мастерами (это зона куратора)
- ❌ Изменять чужие роли
- ❌ Создавать жилые объекты без `businessType`

### Новый функционал куратора:

- ✅ **Смена роли** пользователя: CLIENT → MANAGER, CLIENT → SERVICE и обратно
- ✅ **Список менеджеров** с их объектами и статистикой
- ✅ **Список всех B2B объектов** системы с фильтрами
- ✅ **Переназначение объекта** от одного менеджера к другому
- ✅ **Управление публичностью** B2B объектов напрямую

---

## Этапы реализации

### Шаг 1 — Бэкенд: модель и роль (риск: 0)

- [ ] `MANAGER` в `UserRole` enum
- [ ] `BusinessType` enum с 7 значениями (включая `car_wash`)
- [ ] Миграция БД: `name`, `business_type`, `is_public`, `contact_phone`, `contact_email`, `socials`, `manager_id` в `real_estate`
- [ ] Обновить DTO создания/обновления RealEstate (новые поля опциональны для CLIENT)

### Шаг 2 — Бэкенд: модуль `manager` (риск: низкий)

- [ ] `manager.module.ts`, `manager.guard.ts`
- [ ] `GET/POST/PATCH/DELETE /manager/objects`
- [ ] `PATCH /manager/objects/:id/visibility`
- [ ] `GET/POST /manager/orders`
- [ ] `GET/PATCH /manager/profile`

### Шаг 3 — Бэкенд: расширение куратора (риск: низкий)

- [ ] `GET /curator/managers` + `GET /curator/managers/:id`
- [ ] `PATCH /curator/managers/:id/profile`
- [ ] `GET /curator/b2b-objects` (все B2B объекты системы)
- [ ] `PATCH /curator/b2b-objects/:id/manager` (переназначение)
- [ ] `PATCH /curator/b2b-objects/:id/visibility`
- [ ] **`PATCH /curator/users/:id/role`** — смена роли (ключевой новый эндпоинт)

### Шаг 4 — Бэкенд: публичный эндпоинт (риск: 0)

- [ ] `GET /public/water-points` без авторизации + query params (type, bbox)

### Шаг 5 — Фронт: типы и API хуки

- [ ] `EUserRole.MANAGER` в `t-user.ts`
- [ ] Расширить `TRealEstate` и добавить `EBusinessType`, `TObjectSocials`
- [ ] `t-manager.ts` — новые типы
- [ ] `manager-objects.api.ts`
- [ ] `curator-managers.api.ts` (включая `useChangeUserRole`)
- [ ] `public-water-points.api.ts`

### Шаг 6 — Фронт: кабинет менеджера

- [ ] `manager-access-gate` feature
- [ ] Dashboard layout + sidebar для MANAGER
- [ ] Страницы: account, objects, object-detail, object-form, orders, profile
- [ ] Форма B2B объекта: `name` (обязат.), `businessType` (обязат.), адрес, контакты
- [ ] Переключатель `isPublic` (toggle с пояснением что даёт публичность)

### Шаг 7 — Фронт: расширение кабинета куратора

- [ ] `curator-role-manager` feature (компонент смены роли)
- [ ] Интеграция в `curator-client-detail` — блок с текущей ролью и кнопками смены
- [ ] Новые страницы: `curator/managers`, `curator/managers/[id]`
- [ ] Новая страница: `curator/b2b-objects` — общий список B2B объектов

### Шаг 8 — Фронт: публичная карта

- [ ] Страница `/water-map` с MapLibre GL JS
- [ ] Маркеры разных цветов/иконок по `businessType`
- [ ] Попап: название, тип, адрес, телефон, соцсети
- [ ] Фильтры по `businessType` (чипы)
- [ ] ISR/SSR: `revalidate` каждые 10 минут
