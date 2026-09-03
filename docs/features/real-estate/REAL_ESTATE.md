# Объекты недвижимости (Real Estate) — Web

## Прогресс

| Шаг | Описание                                      | Тесты | Прогресс |
| --- | --------------------------------------------- | ----- | -------- |
| 1   | Типы и shared model                           | —     | ✅ done  |
| 2   | Entity: API хуки (TanStack Query)             | 8     | ✅ done  |
| 3   | Список объектов — страница `/real-estate`     | —     | ✅ done  |
| 4   | Wizard: 1-в-1 перенос из старого фронта       | unit  | ⬜ 0%    |
| 4.1 | └ features/address-search (AHunter подсказки) | —     | ⬜ 0%    |
| 4.2 | └ Step 1: тип + жильцы + источник воды (SVG)  | —     | ⬜ 0%    |
| 4.3 | └ Step 2: адрес с автокомплитом + координаты  | —     | ⬜ 0%    |
| 4.4 | └ Step 3: точки водозабора (SVG + счётчики)   | —     | ⬜ 0%    |
| 4.5 | └ SVG иконки (toilet, sink, bath и т.д.)      | —     | ⬜ 0%    |
| 5   | Селектор адреса в checkout                    | unit  | ⬜ 0%    |

## Что это

Объект недвижимости — адрес клиента, к которому привязываются заказы, установленное оборудование и выезды мастеров. **Обязателен при оформлении заказа** (checkout).

## Бэкенд (уже готов)

AuthGuard поддерживает JWT — бэк работает с web-юзерами без изменений.

### API эндпоинты

```
POST   /real-estate              — создать объект
GET    /real-estate              — список объектов пользователя
GET    /real-estate/:id          — получить объект
PUT    /real-estate/:id          — обновить
DELETE /real-estate/:id          — удалить
GET    /real-estate/:id/products — установленные/доставленные товары
```

### Entity (бэк)

```typescript
RealEstate {
    id: number
    address: string                    // отформатированный адрес
    geoData: TAddressUniversalResponse // ответ AHunter (геокодинг)
    suggestion: TSuggestion            // подсказка адреса
    coordinates: Point                 // PostGIS geometry (lng, lat)
    activeType: 'house' | 'apartment' | 'prom'
    residents: number                  // кол-во жильцов
    activeSource: 'borehole' | 'well' | 'reservoir' | 'waterSupply'
    depthWaterSource?: number
    waterIntakePoints: {               // точки водозабора
        toilet, sink, bath, washingMachine, dishWasher, showerCabin: number
    }
    user: User                         // ManyToOne
    installedEquipment: InstalledEquipment[]  // OneToMany
}
```

### Связь с Checkout/Order

- `CreateOrderFromCartDto.realEstateId` — **обязательное** поле
- При `deliveryType: 'master_delivery'` — координаты объекта используются для расчёта стоимости выезда мастера (OSRM)
- `Order.realEstate` — ManyToOne связь

## Фронтенд (что нужно сделать)

### Шаг 1: Типы

`src/shared/model/t-real-estate.ts`:

```typescript
type TRealEstateType = 'house' | 'apartment' | 'prom';
type TRealEstateSourceWater = 'borehole' | 'well' | 'reservoir' | 'waterSupply';

type TWaterIntakePoints = {
    toilet: number;
    sink: number;
    bath: number;
    washingMachine: number;
    dishWasher: number;
    showerCabin: number;
};

type TRealEstate = {
    id: number;
    address: string;
    geoData: unknown; // TAddressUniversalResponse — типизировать позже
    suggestion: unknown; // TSuggestion — типизировать позже
    coordinates: { type: 'Point'; coordinates: [number, number] };
    activeType: TRealEstateType;
    residents: number;
    activeSource: TRealEstateSourceWater;
    depthWaterSource?: number;
    waterIntakePoints: TWaterIntakePoints;
    created_at: string;
    updated_at: string;
};
```

### Шаг 2: Entity — API хуки

`src/entities/real-estate/api/real-estate.api.ts`:

```typescript
// TanStack Query хуки
useRealEstates()                    — GET /real-estate (список юзера)
useRealEstate(id)                   — GET /real-estate/:id
useCreateRealEstate()               — POST /real-estate (mutation)
useUpdateRealEstate()               — PUT /real-estate/:id (mutation)
useDeleteRealEstate()               — DELETE /real-estate/:id (mutation)
```

**Тесты** (`real-estate.api.test.ts`):

- Корректные query keys
- Правильные URL и методы запросов
- Мутации инвалидируют кэш списка после create/update/delete

### Шаг 3: Список объектов

Страница `/real-estate` в ЛК:

- Список карточек с адресами
- Тип объекта (дом/квартира/промышленный)
- Кол-во жильцов
- Кнопки: редактировать, удалить
- Кнопка «Добавить объект» → wizard

**Референс:** `crm-aqua-kinetics-front/src/pages/real-estate-page/`

**Тесты** (`addresses-page.test.tsx`):

- Рендер списка объектов (мок API)
- Пустой список — показывает «Нет объектов» + кнопка добавления
- Кнопка удаления — вызывает мутацию с подтверждением
- Спиннер при загрузке

### Шаг 4: Wizard добавления/редактирования

3 шага (как в старом фронте):

1. **Адрес + тип** — ввод адреса (AHunter подсказки через бэк-прокси), тип объекта, кол-во жильцов
2. **Источник воды** — скважина/колодец/водохранилище/водопровод, глубина (если скважина/колодец)
3. **Точки водозабора** — счётчики для каждой точки (туалет, раковина, ванна и т.д.)

**Референс:** `crm-aqua-kinetics-front/src/entities/real-estate/ui/real-estate-wizard/`

**Тесты** (`real-estate-wizard.test.tsx`):

- Навигация между шагами (вперёд/назад)
- Валидация: адрес обязателен, тип обязателен, residents > 0
- Zod-схема: невалидные данные (пустой адрес, отрицательные жильцы)
- Submit вызывает createRealEstate/updateRealEstate мутацию
- Режим редактирования: форма заполнена данными объекта

### Шаг 5: Селектор адреса в checkout

Компонент `CheckoutAddressSelector`:

- Выпадающий список объектов пользователя
- Кнопка «Добавить новый адрес» → wizard
- Выбранный `realEstateId` передаётся в `POST /checkout/session`

**Референс:** `crm-aqua-kinetics-front/src/entities/real-estate/ui/checkout-address-selector/`

**Тесты** (`address-selector.test.tsx`):

- Рендер списка адресов пользователя
- Выбор адреса — вызывает onChange с realEstateId
- Нет адресов — показывает только кнопку «Добавить»
- Кнопка «Добавить новый адрес» — открывает wizard

## FSD структура

```
src/
├── shared/model/
│   └── t-real-estate.ts           — типы
├── entities/real-estate/
│   ├── api/real-estate.api.ts     — TanStack Query хуки
│   ├── ui/
│   │   ├── real-estate-card/      — карточка объекта
│   │   └── real-estate-list/      — список объектов
│   ├── types/                     — внутренние типы entity
│   └── index.ts                   — public API
├── features/real-estate/
│   ├── ui/
│   │   ├── real-estate-wizard/    — wizard добавления/редактирования
│   │   └── address-selector/      — селектор для checkout
│   └── index.ts
├── views/
│   └── addresses/
│       └── ui/addresses-page.tsx  — страница списка объектов
└── app/(web)/real-estate/
    └── page.tsx                   — роут
```

## Бэкенд — что может потребоваться

| Задача                          | Нужно?                                                      |
| ------------------------------- | ----------------------------------------------------------- |
| AuthGuard (JWT)                 | ✅ Уже работает                                             |
| CRUD эндпоинты                  | ✅ Готовы                                                   |
| AHunter геокодинг-прокси        | ⚠️ Проверить — может нужен отдельный эндпоинт для подсказок |
| Checkout session с realEstateId | ✅ Готов                                                    |

## Ветки

- **Фронт:** `feature/real-estate-web` от `dev`
- **Бэк (если нужен):** `feature/real-estate-web` от `main`
