'use client';

import { useCartBackendSync } from '../../lib/use-cart-backend-sync';

/**
 * Провайдер синхронизации корзины с бэкендом.
 * Подключается в web layout внутри QueryProvider.
 * Рендерит null — только логика.
 */
export function CartSyncProvider() {
    useCartBackendSync();
    return null;
}
