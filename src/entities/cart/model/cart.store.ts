import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TProduct, TService, EServiceCategory } from '@/shared/model';

// ---- Типы ----

export type TCartServiceItem = {
    service: {
        id: string;
        rateOfHours?: number;
        category?: EServiceCategory;
    };
    count: number;
    price: number;
    checked: boolean;
};

export type TCartItem = {
    product: {
        id: string;
        name: string;
        description?: string;
    };
    count: number;
    price: number;
    services: Record<string, TCartServiceItem>;
};

type TCartStore = {
    items: Record<string, TCartItem>;
    isGuest: boolean;

    // Actions — товары
    addProduct: (product: TProduct, count: number, price: number) => void;
    updateProductCount: (productId: string, count: number) => void;
    removeProduct: (productId: string) => void;

    // Actions — услуги
    addService: (productId: string, service: TService, count: number, price: number) => void;
    updateServiceCount: (productId: string, serviceId: string, count: number) => void;

    // Управление
    clear: () => void;
    setIsGuest: (isGuest: boolean) => void;
};

// ---- Хелперы ----

function shouldRemoveProduct(item: TCartItem): boolean {
    const allServicesZero = Object.values(item.services).every((s) => s.count === 0);
    return item.count === 0 && allServicesZero;
}

function omitKey(obj: Record<string, TCartItem>, key: string): Record<string, TCartItem> {
    return Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key));
}

// ---- Селекторы (чистые функции) ----

export function selectTotalItems(items: Record<string, TCartItem>): number {
    return Object.values(items).reduce((total, item) => {
        const productCount = item.count;
        const servicesCount = Object.values(item.services).reduce(
            (serviceTotal, svc) => serviceTotal + (svc.checked ? svc.count : 0),
            0,
        );
        return total + productCount + servicesCount;
    }, 0);
}

export function selectTotalPrice(items: Record<string, TCartItem>): number {
    let total = 0;
    for (const item of Object.values(items)) {
        total += item.price * item.count;
        for (const svc of Object.values(item.services)) {
            if (svc.checked && svc.count > 0) {
                total += svc.price * svc.count;
            }
        }
    }
    return total;
}

export function selectTotalRateOfHours(items: Record<string, TCartItem>): number {
    return Object.values(items).reduce((total, item) => {
        const servicesTotal = Object.values(item.services).reduce(
            (sum, svc) => sum + svc.count * (svc.service.rateOfHours || 0),
            0,
        );
        return total + servicesTotal;
    }, 0);
}

// ---- Store ----

export const useCartStore = create<TCartStore>()(
    persist(
        (set) => ({
            items: {},
            isGuest: true,

            addProduct: (product, count, price) =>
                set((state) => {
                    const existing = state.items[product.id];
                    if (existing) {
                        return {
                            items: {
                                ...state.items,
                                [product.id]: {
                                    ...existing,
                                    count: existing.count + count,
                                },
                            },
                        };
                    }
                    return {
                        items: {
                            ...state.items,
                            [product.id]: {
                                product: {
                                    id: product.id,
                                    name: product.name,
                                    description: product.description,
                                },
                                count,
                                price,
                                services: {},
                            },
                        },
                    };
                }),

            updateProductCount: (productId, count) =>
                set((state) => {
                    const item = state.items[productId];
                    if (!item) return state;

                    const updated = { ...item, count };
                    if (shouldRemoveProduct(updated)) {
                        return { items: omitKey(state.items, productId) };
                    }
                    return {
                        items: { ...state.items, [productId]: updated },
                    };
                }),

            removeProduct: (productId) =>
                set((state) => ({ items: omitKey(state.items, productId) })),

            addService: (productId, service, count, price) =>
                set((state) => {
                    const item = state.items[productId];
                    if (!item) return state;

                    return {
                        items: {
                            ...state.items,
                            [productId]: {
                                ...item,
                                services: {
                                    ...item.services,
                                    [service.id]: {
                                        service: {
                                            id: service.id,
                                            rateOfHours: service.rateOfHours,
                                            category: service.category,
                                        },
                                        count,
                                        price,
                                        checked: count > 0,
                                    },
                                },
                            },
                        },
                    };
                }),

            updateServiceCount: (productId, serviceId, count) =>
                set((state) => {
                    const item = state.items[productId];
                    const svc = item?.services?.[serviceId];
                    if (!item || !svc) return state;

                    const updatedItem = {
                        ...item,
                        services: {
                            ...item.services,
                            [serviceId]: {
                                ...svc,
                                count,
                                checked: count > 0,
                            },
                        },
                    };

                    if (shouldRemoveProduct(updatedItem)) {
                        return { items: omitKey(state.items, productId) };
                    }

                    return {
                        items: { ...state.items, [productId]: updatedItem },
                    };
                }),

            clear: () => set({ items: {} }),
            setIsGuest: (isGuest) => set({ isGuest }),
        }),
        {
            name: 'prostor-cart',
        },
    ),
);
