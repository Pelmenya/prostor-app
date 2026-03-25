import { EServiceCategory } from '@/shared/model';
import type { TCartItem, TCartServiceItem } from '../model/cart.store';
import type { TBackendCartState, TBackendCartItem, TBackendServiceEntry } from '../api/cart.types';

const VALID_CATEGORIES = new Set<string>(Object.values(EServiceCategory));

function parseServiceCategory(value: string | undefined): EServiceCategory | undefined {
    if (!value || !VALID_CATEGORIES.has(value)) return undefined;
    return value as EServiceCategory;
}

/**
 * Конвертирует Zustand cart items → бэкенд TCartState.
 *
 * Разница форматов:
 * - Фронт: `serviceInfo: { id, name, category, ... }`
 * - Бэк:   `service: { id, name, ... }` (category сохраняется в JSONB как есть)
 */
export function toBackendCartState(items: Record<string, TCartItem>): TBackendCartState {
    const backendItems: Record<string, TBackendCartItem> = {};

    for (const [productId, item] of Object.entries(items)) {
        const services: Record<string, TBackendServiceEntry> = {};

        for (const [serviceId, svc] of Object.entries(item.services)) {
            services[serviceId] = {
                service: {
                    id: svc.serviceInfo.id,
                    name: svc.serviceInfo.name,
                    rateOfHours: svc.serviceInfo.rateOfHours,
                    category: svc.serviceInfo.category,
                },
                count: svc.count,
                price: svc.price,
                checked: svc.checked,
                selectedForCheckout: svc.selectedForCheckout,
            };
        }

        backendItems[productId] = {
            product: {
                id: item.product.id,
                name: item.product.name,
                description: item.product.description,
            },
            count: item.count,
            price: item.price,
            selectedForCheckout: item.selectedForCheckout,
            services,
        };
    }

    return { items: backendItems };
}

/**
 * Конвертирует бэкенд TCartState → Zustand cart items.
 *
 * - `service` → `serviceInfo`
 * - `category` восстанавливается из JSONB (если сохранялась)
 * - `selectedForCheckout` по умолчанию true (бэк хранит optional)
 */
export function fromBackendCartState(backendState: TBackendCartState): Record<string, TCartItem> {
    const items: Record<string, TCartItem> = {};

    if (!backendState?.items) return items;

    for (const [productId, backendItem] of Object.entries(backendState.items)) {
        const services: Record<string, TCartServiceItem> = {};

        if (backendItem.services) {
            for (const [serviceId, svc] of Object.entries(backendItem.services)) {
                services[serviceId] = {
                    serviceInfo: {
                        id: svc.service.id,
                        name: svc.service.name,
                        rateOfHours: svc.service.rateOfHours,
                        category: parseServiceCategory(svc.service.category),
                    },
                    count: svc.count,
                    price: svc.price,
                    checked: svc.checked,
                    selectedForCheckout: svc.selectedForCheckout ?? true,
                };
            }
        }

        items[productId] = {
            product: {
                id: backendItem.product.id,
                name: backendItem.product.name,
                description: backendItem.product.description,
            },
            count: backendItem.count,
            price: backendItem.price,
            selectedForCheckout: backendItem.selectedForCheckout ?? true,
            services,
        };
    }

    return items;
}
