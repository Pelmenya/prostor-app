# API: редактирование настроек мастера куратором

Контракты эндпоинтов для фронта. Реализация: `b875e97` + `d491e4e`.
ТЗ-источник: [CURATOR_MASTER_EDIT.md](./CURATOR_MASTER_EDIT.md).

**Базовый URL:** все эндпоинты под префиксом `/curator/users/:userId/...`.
**Авторизация:** только роль `CURATOR`. Заголовки — как у остальных API
(Telegram init data или JWT, см. `ApiTmaAuthHeader`).
**Swagger:** `GET /api/docs` (тег `Curator`).

---

## Общие правила

### Коды ответов

| Код   | Когда                                                                                                |
| ----- | ---------------------------------------------------------------------------------------------------- |
| `200` | Успех (для PATCH/POST). Тело — обновлённая сущность                                                  |
| `204` | Успех без тела (только `PUT .../zones`)                                                              |
| `400` | Невалидное тело (детали в `message[]`)                                                               |
| `401` | Нет/невалидная авторизация                                                                           |
| `403` | Авторизован, но не CURATOR                                                                           |
| `404` | Пользователь не найден ИЛИ это не мастер (`role !== 'service'`) ИЛИ у мастера ещё нет AccountService |

### Важно про 404

`PATCH .../location|vehicle|schedule` и `POST .../fill-calendar` бросают `404`,
если у мастера ещё **не создан** `AccountService` (например, мастер не прошёл
онбординг). Куратор-эндпоинты только редактируют, не создают.

**Решение для фронта:** если получили `404 "AccountService not found for this master"` —
показать onboarding-prompt или ничего не сохранять.

### Все поля опциональные

Любой `PATCH` принимает только те поля, которые меняются. Не передавайте `null`
просто чтобы «оставить как есть» — не передавайте поле вообще. Исключение:
`storeId: null` — означает «отвязать склад» (пустая строка `""` тоже работает,
бэк нормализует в `null`).

---

## 1. Профиль мастера

```
PATCH /curator/users/:userId/profile
```

**Тело (`UpdateMasterProfileDto`):**

| Поле         | Тип    | Валидация           | Описание                                       |
| ------------ | ------ | ------------------- | ---------------------------------------------- |
| `first_name` | string | trim, 1..100        | Имя. Пробельные значения отсекаются после trim |
| `last_name`  | string | trim, 1..100        | Фамилия                                        |
| `phone`      | string | regex `^\+7\d{10}$` | Только российские номера в E.164               |

> ⚠️ `email` через этот эндпоинт менять **нельзя** — отдельный флоу с подтверждением (`POST /auth/change-email`).

**Пример:**

```json
{
    "first_name": "Иван",
    "last_name": "Иванов",
    "phone": "+79001234567"
}
```

**Ответ 200:** обновлённый `User`.

---

## 2. Локация мастера

```
PATCH /curator/users/:userId/account-service/location
```

**Тело (`UpdateMasterLocationDto`):**

| Поле             | Тип                                | Валидация             | Описание                                       |
| ---------------- | ---------------------------------- | --------------------- | ---------------------------------------------- |
| `address`        | string                             | max 500               | Адрес одной строкой                            |
| `coordinates`    | `PointDto`                         | см. ниже              | GeoJSON Point                                  |
| `suggestion`     | object                             | —                     | Подсказка от AHunter                           |
| `geoData`        | object                             | —                     | Геоданные адреса                               |
| `departureBasis` | `'OWN_ADDRESS' \| 'NEAREST_STORE'` | enum                  | Откуда считать выезд                           |
| `storeId`        | string \| null                     | max 64; `""` → `null` | ID «склада» в МойСклад. `null`/`""` = отвязать |

**`PointDto`:**

```ts
{
    type: 'Point'; // строго 'Point'
    coordinates: [number, number]; // [lon, lat], каждый в [-180, 180]
}
```

> 📍 **Порядок [lon, lat]** — GeoJSON-стандарт, не Яндекс-формат `[lat, lon]`.
> Если фронт хранит координаты для Яндекс.Карт в `[lat, lon]` — перевернуть **перед** отправкой.

**Пример:**

```json
{
    "address": "Москва, ул. Ленина, 1",
    "coordinates": { "type": "Point", "coordinates": [37.6176, 55.7558] },
    "suggestion": {
        /* AHunter */
    },
    "geoData": {
        /* AHunter */
    },
    "departureBasis": "OWN_ADDRESS",
    "storeId": "12345678-1234-1234-1234-123456789012"
}
```

**Ответ 200:** обновлённый `AccountService`.

---

## 3. Авто и грузоподъёмность

```
PATCH /curator/users/:userId/account-service/vehicle
```

**Тело (`UpdateMasterVehicleDto`):**

| Поле             | Тип    | Валидация | Описание                   |
| ---------------- | ------ | --------- | -------------------------- |
| `grade`          | enum   | см. ниже  | Грейд мастера              |
| `carModel`       | string | —         | Модель авто                |
| `carNumber`      | string | —         | Гос. номер                 |
| `maxCargoLength` | number | int, ≥ 0  | Длина грузового отсека, см |
| `maxCargoWidth`  | number | int, ≥ 0  | Ширина, см                 |
| `maxCargoHeight` | number | int, ≥ 0  | Высота, см                 |
| `maxCargoWeight` | number | int, ≥ 0  | Макс. вес, кг              |

**`EServiceGrade`:**

| Значение              | Описание                          |
| --------------------- | --------------------------------- |
| `'courier'`           | Курьер (только доставка)          |
| `'master'`            | Мастер (бытовой сегмент)          |
| `'specialist'`        | Специалист (бытовой + коттеджный) |
| `'senior_specialist'` | Старший специалист (все сегменты) |

> ⚠️ `grade` синхронизируется с `segments` в БД (через `BeforeUpdate`).
> Если передан `grade` явно — он будет проставлен. Если переданы `segments` —
> grade пересчитается. В куратор-эндпоинте `segments` не принимается, передавайте `grade`.

**Пример:**

```json
{
    "grade": "specialist",
    "carModel": "Lada Largus",
    "carNumber": "А123БВ77",
    "maxCargoLength": 200,
    "maxCargoWidth": 150,
    "maxCargoHeight": 120,
    "maxCargoWeight": 500
}
```

**Ответ 200:** обновлённый `AccountService`.

---

## 4. Шаблон расписания

```
PATCH /curator/users/:userId/account-service/schedule
```

**Тело (`UpdateMasterScheduleDto`):**

| Поле             | Тип            | Описание                                                                       |
| ---------------- | -------------- | ------------------------------------------------------------------------------ |
| `workDays`       | `WorkDayDto[]` | Шаблон рабочих дней                                                            |
| `calendarMonths` | number         | На сколько месяцев вперёд разворачивать в календарь (`POST .../fill-calendar`) |

**`WorkDayDto`:**

```ts
{
    date: Date | null; // null для шаблона (по дню недели)
    dayOfWeek: number; // 0 = воскресенье, 6 = суббота
    startHour: number; // 0..23
    startMinute: number; // 0..59
    endHour: number; // 0..23
    endMinute: number; // 0..59
}
```

> ⚠️ Сейчас на `dayOfWeek`/`startHour`/... диапазоны на бэке **не** валидируются жёстко (в бэклоге). Фронт сам должен присылать корректные значения.

**Пример (пн–пт 9:00–18:00):**

```json
{
    "workDays": [
        {
            "date": null,
            "dayOfWeek": 1,
            "startHour": 9,
            "startMinute": 0,
            "endHour": 18,
            "endMinute": 0
        },
        {
            "date": null,
            "dayOfWeek": 2,
            "startHour": 9,
            "startMinute": 0,
            "endHour": 18,
            "endMinute": 0
        },
        {
            "date": null,
            "dayOfWeek": 3,
            "startHour": 9,
            "startMinute": 0,
            "endHour": 18,
            "endMinute": 0
        },
        {
            "date": null,
            "dayOfWeek": 4,
            "startHour": 9,
            "startMinute": 0,
            "endHour": 18,
            "endMinute": 0
        },
        {
            "date": null,
            "dayOfWeek": 5,
            "startHour": 9,
            "startMinute": 0,
            "endHour": 18,
            "endMinute": 0
        }
    ],
    "calendarMonths": 3
}
```

**Ответ 200:** обновлённый `AccountService`. Шаблон сохраняется, но **календарь
ещё не построен** — это делает следующий эндпоинт.

---

## 5. Развернуть шаблон в календарь

```
POST /curator/users/:userId/fill-calendar
```

**Тело:** пустое (`{}` или ничего).

**Что делает:** берёт сохранённые `workDays` + `calendarMonths` из `AccountService`
мастера и генерирует/обновляет `CalendarWorkDay` записи на `calendarMonths * 30`
дней вперёд. Дни вне диапазона — мягко удаляются.

> Вызывать **сразу после** `PATCH .../schedule`. Так делает и мастерский флоу.

**Ответ 200:** `CalendarWorkDay[]` — все рабочие дни мастера (включая ранее существующие).

---

## 6. Зоны обслуживания

```
PUT /curator/users/:userId/zones
```

Полная замена набора зон. Передать `[]` — снять все зоны.

**Тело (`UpdateMyZonesDto`):**

| Поле      | Тип      | Валидация                                                        |
| --------- | -------- | ---------------------------------------------------------------- |
| `zoneIds` | number[] | Каждый — int ≥ 1 (текущий код: `@IsNumber`, без верхнего лимита) |

> ℹ️ Лимит на размер массива (`@ArrayMaxSize`) на момент написания ещё не выставлен — фронту разумно не отправлять >500 зон.

**Пример:**

```json
{ "zoneIds": [1, 3, 7, 42] }
```

**Ответ 204** No Content. Чтобы получить актуальный список зон — отдельный запрос:

```
GET /zones/my?userId=:userId
```

(этот прокси-эндпоинт уже существует и принимает `?userId=` от куратора).

---

## 7. Флаг «может редактировать сам» (уже было)

```
PATCH /curator/users/:userId/can-edit
```

**Тело:** `{ "canEdit": boolean }`. Управление флагом `AccountService.canEdit`
(разрешить/запретить мастеру редактировать настройки в своём кабинете).

---

## Сводная таблица для генерации хуков

```ts
// Все запросы — JSON, авторизация через стандартные заголовки приложения.

[
    { method: 'PATCH', path: '/curator/users/:userId/profile', section: 'profile' },
    {
        method: 'PATCH',
        path: '/curator/users/:userId/account-service/location',
        section: 'location',
    },
    { method: 'PATCH', path: '/curator/users/:userId/account-service/vehicle', section: 'vehicle' },
    {
        method: 'PATCH',
        path: '/curator/users/:userId/account-service/schedule',
        section: 'schedule',
    },
    { method: 'POST', path: '/curator/users/:userId/fill-calendar', section: 'calendar' },
    { method: 'PUT', path: '/curator/users/:userId/zones', section: 'zones' },
    { method: 'PATCH', path: '/curator/users/:userId/can-edit', section: 'can-edit' },
];
```

---

## Типы (TypeScript, скопировать в фронт)

```ts
// enums
export enum EServiceGrade {
    COURIER = 'courier',
    MASTER = 'master',
    SPECIALIST = 'specialist',
    SENIOR_SPECIALIST = 'senior_specialist',
}

export enum EDepartureBasis {
    OWN_ADDRESS = 'OWN_ADDRESS',
    NEAREST_STORE = 'NEAREST_STORE',
}

// geo
export type TPoint = {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat], каждый −180..180
};

// schedule
export type TWorkDay = {
    date: Date | null;
    dayOfWeek: number; // 0..6
    startHour: number; // 0..23
    startMinute: number; // 0..59
    endHour: number; // 0..23
    endMinute: number; // 0..59
};

// request bodies
export type TUpdateMasterProfileBody = Partial<{
    first_name: string;
    last_name: string;
    phone: string; // /^\+7\d{10}$/
}>;

export type TUpdateMasterLocationBody = Partial<{
    address: string; // ≤ 500
    coordinates: TPoint;
    suggestion: unknown; // от AHunter
    geoData: unknown; // от AHunter
    departureBasis: EDepartureBasis;
    storeId: string | null; // ≤ 64; '' → null
}>;

export type TUpdateMasterVehicleBody = Partial<{
    grade: EServiceGrade;
    carModel: string;
    carNumber: string;
    maxCargoLength: number; // ≥ 0
    maxCargoWidth: number;
    maxCargoHeight: number;
    maxCargoWeight: number;
}>;

export type TUpdateMasterScheduleBody = Partial<{
    workDays: TWorkDay[];
    calendarMonths: number; // ≥ 1
}>;

export type TUpdateMyZonesBody = {
    zoneIds: number[]; // int ≥ 1, рекомендуется ≤ 500
};
```

---

## Чеклист интеграции для фронта

- [ ] 7 новых TanStack Query `useMutation` хуков (по одному на эндпоинт + can-edit уже был)
- [ ] Реиспользовать существующие формы (`ProfileForm`, `LocationForm`, `VehicleForm`, `WeeklyScheduleForm`, `ZoneSelector`)
- [ ] Передавать `userId` мастера вместо `currentUser.id`
- [ ] После `PATCH .../schedule` — сразу `POST .../fill-calendar` (как в мастерском флоу)
- [ ] После `PUT .../zones` — рефетч `GET /zones/my?userId=...` для актуального списка
- [ ] Обработать 404 «нет AccountService» — показать prompt пройти онбординг
- [ ] Не слать `email` в `/profile` — будет молча проигнорирован, лучше скрыть в UI
