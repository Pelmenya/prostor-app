# Корзина: стратегия для web

## Статус: 🟡 Планирование

## Архитектура

```
ГОСТЬ (без логина)                    ПОСЛЕ ЛОГИНА
──────────────────                    ──────────────
Zustand store                         Бэк (Cart entity)
    ↓ persist                             ↑
localStorage                          POST /cart/sync
                                          ↑
                                      merge стратегия
```

## Как работает

### Гость (не залогинен)

1. Пользователь добавляет товар → Zustand store обновляется мгновенно
2. Zustand persist → localStorage (переживает перезагрузку)
3. Бэк НЕ знает о корзине — ноль запросов
4. UI: badge на иконке корзины, страница корзины — всё из Zustand

### После логина

1. Пользователь авторизуется (NextAuth / Telegram / MAX)
2. Фронт отправляет `POST /cart/sync` с содержимым localStorage корзины
3. Бэк мержит с существующей корзиной пользователя:
    - Товар есть в обоих → берём максимальное количество
    - Товар только в localStorage → добавляем
    - Товар только на бэке → оставляем
4. Бэк возвращает актуальную корзину
5. Zustand обновляется из ответа бэка
6. localStorage корзина очищается (теперь источник правды — бэк)

### Залогиненный пользователь

1. Все изменения корзины → мутации на бэк (как в старом фронте)
2. Zustand = кеш бэка (optimistic updates через TanStack Query)
3. localStorage = fallback при потере соединения

## Zustand store

```typescript
// entities/cart/model/cart.store.ts

type TCartItem = {
    productId: string;
    name: string;
    price: number; // snapshot цены на момент добавления
    count: number;
    imageUrl?: string;
    services: Record<string, TCartService>;
};

type TCartService = {
    serviceId: string;
    name: string;
    price: number; // snapshot
    rateOfHours: number;
    category: EServiceCategory;
    count: number;
    checked: boolean;
};

type TCartStore = {
    items: Record<string, TCartItem>;
    isGuest: boolean; // true = localStorage, false = бэк

    // Actions
    addProduct: (product: TProduct, count: number) => void;
    updateCount: (productId: string, count: number) => void;
    removeProduct: (productId: string) => void;
    addService: (productId: string, service: TService, count: number) => void;
    updateServiceCount: (productId: string, serviceId: string, count: number) => void;
    clear: () => void;
    syncFromBackend: (backendCart: TBackendCart) => void;

    // Selectors
    totalPrice: () => number;
    totalItems: () => number;
    getItem: (productId: string) => TCartItem | undefined;
};
```

## Бэк — один новый эндпоинт

```
POST /cart/sync
Authorization: Bearer <jwt>
Content-Type: application/json

{
    "items": [
        {
            "productId": "abc-123",
            "count": 2,
            "services": {
                "svc-456": { "count": 1 }
            }
        }
    ]
}

Response: полная корзина пользователя после merge
```

**Merge стратегия:**

- `max(localStorage.count, backend.count)` — не теряем товары
- Услуги мержатся аналогично
- Цены берутся актуальные с бэка (не snapshot из localStorage)

## Temp таблица НЕ нужна

- localStorage хранит корзину на клиенте
- Нет temp carts на бэке → нет крона для очистки
- Браузер сам чистит localStorage если места мало
- После логина корзина уезжает на бэк

## Ограничения

- Гостевая корзина привязана к одному браузеру (не синхронизируется между устройствами до логина)
- Это ок — 95% пользователей не меняют устройство между добавлением в корзину и оплатой

## Связанные документы

- `docs/features/AUTH_ADAPTER.md` — авторизация (login → sync)
- Старый фронт: `src/entities/cart/model/cart-slice.ts` — Redux cart (референс)
