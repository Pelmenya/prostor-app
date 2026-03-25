'use client';

import { useSyncExternalStore } from 'react';
import { useCartStore } from '../model/cart.store';

/**
 * Ждёт гидратацию Zustand persist для cart store.
 * Возвращает false на сервере и до гидратации, true после.
 */
export function useCartHydrated(): boolean {
    return useSyncExternalStore(
        (onStoreChange) => {
            if (useCartStore.persist.hasHydrated()) return () => {};
            const unsub = useCartStore.persist.onFinishHydration(onStoreChange);
            return unsub;
        },
        () => useCartStore.persist.hasHydrated(),
        () => false,
    );
}
