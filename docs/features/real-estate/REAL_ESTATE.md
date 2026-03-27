# Объекты недвижимости (Real Estate) — Web

## Прогресс

| Шаг | Описание                                        | Прогресс |
| --- | ----------------------------------------------- | -------- |
| 1   | Типы и shared model                             | ⬜ 0%    |
| 2   | Entity: API хуки (TanStack Query)               | ⬜ 0%    |
| 3   | Список объектов — страница `/profile/addresses` | ⬜ 0%    |
| 4   | Wizard добавления/редактирования объекта        | ⬜ 0%    |
| 5   | Селектор адреса в checkout                      | ⬜ 0%    |
| 6   | Тесты                                           | ⬜ 0%    |

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

### Шаг 3: Список объектов

Страница `/profile/addresses` в ЛК:

- Список карточек с адресами
- Тип объекта (дом/квартира/промышленный)
- Кол-во жильцов
- Кнопки: редактировать, удалить
- Кнопка «Добавить объект» → wizard

**Референс:** `crm-aqua-kinetics-front/src/pages/real-estate-page/`

### Шаг 4: Wizard добавления/редактирования

3 шага (как в старом фронте):

1. **Адрес + тип** — ввод адреса (AHunter подсказки через бэк-прокси), тип объекта, кол-во жильцов
2. **Источник воды** — скважина/колодец/водохранилище/водопровод, глубина (если скважина/колодец)
3. **Точки водозабора** — счётчики для каждой точки (туалет, раковина, ванна и т.д.)

**Референс:** `crm-aqua-kinetics-front/src/entities/real-estate/ui/real-estate-wizard/`

### Шаг 5: Селектор адреса в checkout

Компонент `CheckoutAddressSelector`:

- Выпадающий список объектов пользователя
- Кнопка «Добавить новый адрес» → wizard
- Выбранный `realEstateId` передаётся в `POST /checkout/session`

**Референс:** `crm-aqua-kinetics-front/src/entities/real-estate/ui/checkout-address-selector/`

### Шаг 6: Тесты

- API хуки: корректность запросов
- Wizard: валидация на каждом шаге
- Selector: выбор/создание объекта
- Zustand store (если будет)

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
└── app/(web)/profile/addresses/
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
