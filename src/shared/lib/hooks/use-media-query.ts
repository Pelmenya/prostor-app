'use client';

import { useSyncExternalStore } from 'react';

/**
 * Подписка на media query через `useSyncExternalStore` — SSR-safe (default
 * false) + reactive update при изменении viewport. Без `setState` в `useEffect`
 * (правило React 19 `react-hooks/set-state-in-effect`).
 *
 * SSR-snapshot всегда `false` (server не знает viewport юзера). После
 * hydration клиент проверяет `window.matchMedia(query).matches`.
 *
 * Пример:
 * ```tsx
 * const isDesktop = useMediaQuery('(min-width: 992px)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
    const subscribe = (cb: () => void) => {
        if (typeof window === 'undefined') return () => {};
        const mql = window.matchMedia(query);
        mql.addEventListener('change', cb);
        return () => mql.removeEventListener('change', cb);
    };
    const getSnapshot = () => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    };
    const getServerSnapshot = () => false;
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
