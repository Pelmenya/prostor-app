import type { TCartItem, TCartServiceItem } from '@/entities/cart';

/**
 * Мержит локальную (guest) корзину с серверной.
 *
 * Стратегия:
 * - Товар есть в обоих → `max(local.count, server.count)`
 * - Товар только в local → добавляем
 * - Товар только на сервере → оставляем
 * - Услуги мержатся аналогично
 * - `selectedForCheckout` — берём из серверной (если есть), иначе из локальной
 * - Цены берутся с сервера (актуализированы из МойСклад)
 */
export function mergeCartItems(
    localItems: Record<string, TCartItem>,
    serverItems: Record<string, TCartItem>,
): Record<string, TCartItem> {
    const merged: Record<string, TCartItem> = {};

    // Все уникальные productId из обоих источников
    const allProductIds = new Set([...Object.keys(localItems), ...Object.keys(serverItems)]);

    for (const productId of allProductIds) {
        const local = localItems[productId];
        const server = serverItems[productId];

        if (!local) {
            // Только на сервере — берём как есть
            merged[productId] = server;
            continue;
        }

        if (!server) {
            // Только в local — берём как есть
            merged[productId] = local;
            continue;
        }

        // Есть в обоих — мержим
        merged[productId] = {
            product: server.product, // инфо о товаре с сервера (может быть актуальнее)
            count: Math.max(local.count, server.count),
            price: server.price, // актуальная цена с сервера
            selectedForCheckout: server.selectedForCheckout,
            services: mergeServices(local.services, server.services),
        };
    }

    return merged;
}

function mergeServices(
    localServices: Record<string, TCartServiceItem>,
    serverServices: Record<string, TCartServiceItem>,
): Record<string, TCartServiceItem> {
    const merged: Record<string, TCartServiceItem> = {};

    const allServiceIds = new Set([...Object.keys(localServices), ...Object.keys(serverServices)]);

    for (const serviceId of allServiceIds) {
        const local = localServices[serviceId];
        const server = serverServices[serviceId];

        if (!local) {
            merged[serviceId] = server;
            continue;
        }

        if (!server) {
            merged[serviceId] = local;
            continue;
        }

        // Мержим — max count, цена с сервера
        const mergedCount = Math.max(local.count, server.count);
        merged[serviceId] = {
            serviceInfo: server.serviceInfo.id ? server.serviceInfo : local.serviceInfo,
            count: mergedCount,
            price: server.price,
            checked: mergedCount > 0,
            selectedForCheckout: server.selectedForCheckout,
        };
    }

    return merged;
}
