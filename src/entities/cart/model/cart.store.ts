import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TProduct, TService, EServiceCategory } from '@/shared/model';

// ---- Типы ----

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
    removeService: (productId: string, serviceId: string) => void;

    // Actions — selectedForCheckout
    toggleProductSelected: (productId: string) => void;
    toggleServiceSelected: (productId: string, serviceId: string) => void;
    toggleAllSelected: (selected: boolean) => void;
    removeSelected: () => void;

    // Управление
    clear: () => void;
    setIsGuest: (isGuest: boolean) => void;
    replaceItems: (items: Record<string, TCartItem>) => void;
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
            (sum, svc) => sum + svc.count * (svc.serviceInfo.rateOfHours || 0),
            0,
        );
        return total + servicesTotal;
    }, 0);
}

export function selectAreAllSelected(items: Record<string, TCartItem>): boolean {
    const entries = Object.values(items);
    if (entries.length === 0) return false;

    return entries.every((item) => {
        if (!item.selectedForCheckout) return false;
        return Object.values(item.services).every((svc) => !svc.checked || svc.selectedForCheckout);
    });
}

export function selectHasSelectedItems(items: Record<string, TCartItem>): boolean {
    return Object.values(items).some((item) => {
        if (item.selectedForCheckout) return true;
        return Object.values(item.services).some((svc) => svc.checked && svc.selectedForCheckout);
    });
}

export function selectSelectedItems(items: Record<string, TCartItem>): Record<string, TCartItem> {
    const result: Record<string, TCartItem> = {};

    for (const [productId, item] of Object.entries(items)) {
        const selectedServices: Record<string, TCartServiceItem> = {};
        for (const [svcId, svc] of Object.entries(item.services)) {
            if (svc.checked && svc.selectedForCheckout) {
                selectedServices[svcId] = svc;
            }
        }

        if (item.selectedForCheckout || Object.keys(selectedServices).length > 0) {
            result[productId] = {
                ...item,
                services: selectedServices,
            };
        }
    }

    return result;
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
                                selectedForCheckout: true,
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
                set((state) => {
                    const item = state.items[productId];
                    if (!item) return state;

                    const hasActiveServices = Object.values(item.services).some(
                        (s) => s.checked && s.count > 0,
                    );

                    if (hasActiveServices) {
                        return {
                            items: {
                                ...state.items,
                                [productId]: { ...item, count: 0 },
                            },
                        };
                    }

                    return { items: omitKey(state.items, productId) };
                }),

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
                                        serviceInfo: {
                                            id: service.id,
                                            name: service.name,
                                            rateOfHours: service.rateOfHours,
                                            category: service.category,
                                        },
                                        count,
                                        price,
                                        checked: count > 0,
                                        selectedForCheckout: true,
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

            removeService: (productId, serviceId) =>
                set((state) => {
                    const item = state.items[productId];
                    if (!item) return state;

                    const { [serviceId]: _removed, ...remainingServices } = item.services;
                    const updatedItem = { ...item, services: remainingServices };

                    if (shouldRemoveProduct(updatedItem)) {
                        return { items: omitKey(state.items, productId) };
                    }

                    return { items: { ...state.items, [productId]: updatedItem } };
                }),

            toggleProductSelected: (productId) =>
                set((state) => {
                    const item = state.items[productId];
                    if (!item) return state;

                    return {
                        items: {
                            ...state.items,
                            [productId]: {
                                ...item,
                                selectedForCheckout: !item.selectedForCheckout,
                            },
                        },
                    };
                }),

            toggleServiceSelected: (productId, serviceId) =>
                set((state) => {
                    const item = state.items[productId];
                    const svc = item?.services?.[serviceId];
                    if (!item || !svc) return state;

                    return {
                        items: {
                            ...state.items,
                            [productId]: {
                                ...item,
                                services: {
                                    ...item.services,
                                    [serviceId]: {
                                        ...svc,
                                        selectedForCheckout: !svc.selectedForCheckout,
                                    },
                                },
                            },
                        },
                    };
                }),

            toggleAllSelected: (selected) =>
                set((state) => {
                    const updated: Record<string, TCartItem> = {};
                    for (const [id, item] of Object.entries(state.items)) {
                        const updatedServices: Record<string, TCartServiceItem> = {};
                        for (const [svcId, svc] of Object.entries(item.services)) {
                            updatedServices[svcId] = { ...svc, selectedForCheckout: selected };
                        }
                        updated[id] = {
                            ...item,
                            selectedForCheckout: selected,
                            services: updatedServices,
                        };
                    }
                    return { items: updated };
                }),

            removeSelected: () =>
                set((state) => {
                    const updated: Record<string, TCartItem> = {};
                    for (const [id, item] of Object.entries(state.items)) {
                        if (item.selectedForCheckout) continue;

                        const remainingServices: Record<string, TCartServiceItem> = {};
                        for (const [svcId, svc] of Object.entries(item.services)) {
                            if (!svc.selectedForCheckout) {
                                remainingServices[svcId] = svc;
                            }
                        }

                        const updatedItem = { ...item, services: remainingServices };
                        if (!shouldRemoveProduct(updatedItem)) {
                            updated[id] = updatedItem;
                        }
                    }
                    return { items: updated };
                }),

            clear: () => set({ items: {} }),
            setIsGuest: (isGuest) => set({ isGuest }),
            replaceItems: (items) => set({ items }),
        }),
        {
            name: 'prostor-cart',
        },
    ),
);
