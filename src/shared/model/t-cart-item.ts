import type { EServiceCategory } from './t-product';

export type TCartServiceItem = {
    serviceInfo: {
        id: string;
        name: string;
        rateOfHours?: number;
        category?: EServiceCategory;
    };
    count: number;
    price: number;
    /** true — услуга активна (count > 0); false — услуга добавлена, но деактивирована (count = 0) */
    checked: boolean;
    /** true — услуга включена в оформление заказа (галочка выбора) */
    selectedForCheckout: boolean;
};

export type TCartItem = {
    product: {
        id: string;
        name: string;
        description?: string;
    };
    count: number;
    price: number;
    selectedForCheckout: boolean;
    services: Record<string, TCartServiceItem>;
};
