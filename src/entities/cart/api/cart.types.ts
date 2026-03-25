/**
 * Типы корзины, соответствующие бэкенд-формату (Cart entity, JSONB cartState).
 *
 * Бэкенд хранит услуги как `service: Partial<TService>`,
 * а фронтенд Zustand store использует `serviceInfo: { id, name, ... }`.
 * Маппер в `cart-mappers.ts` конвертирует между форматами.
 */

export type TBackendServiceEntry = {
    service: {
        id: string;
        name: string;
        rateOfHours?: number;
        description?: string;
        /** Категория сохраняется в JSONB — бэк не трогает это поле */
        category?: string;
    };
    count: number;
    price: number;
    checked: boolean;
    selectedForCheckout?: boolean;
};

export type TBackendCartItem = {
    product: {
        id: string;
        name: string;
        description?: string;
    };
    count: number;
    price: number;
    selectedForCheckout?: boolean;
    services: Record<string, TBackendServiceEntry>;
};

export type TBackendCartState = {
    id?: string;
    items: Record<string, TBackendCartItem>;
    totalRateOfHours?: number;
    totalPrice?: number;
    totalProductsPrice?: number;
    totalServicesPrice?: number;
};
