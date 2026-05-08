'use client';

import { useSyncExternalStore } from 'react';

/**
 * Подписка на `data-theme` на `<html>` (daisyui механизм переключения).
 * `useSyncExternalStore` — стабильная API для синхронизации с external mutable
 * source (DOM-attribute) без `setState` в `useEffect` (правило React 19
 * `react-hooks/set-state-in-effect`).
 *
 * SSR-snapshot = `'light'` (default daisyui тема). После hydration клиент
 * читает фактический attribute и перерисовывается на каждый MutationObserver tick.
 *
 * Пример:
 * ```tsx
 * const theme = useDaisyTheme(); // 'light' | 'dark'
 * <Map style={theme === 'dark' ? DARK_URL : LIGHT_URL} />
 * ```
 */

const SUBSCRIBERS = new Set<() => void>();
let observer: MutationObserver | null = null;

function ensureObserver(): void {
    if (observer || typeof document === 'undefined') return;
    observer = new MutationObserver(() => {
        for (const cb of SUBSCRIBERS) cb();
    });
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
    });
}

function subscribe(cb: () => void): () => void {
    ensureObserver();
    SUBSCRIBERS.add(cb);
    return () => {
        SUBSCRIBERS.delete(cb);
        if (SUBSCRIBERS.size === 0) {
            observer?.disconnect();
            observer = null;
        }
    };
}

function getSnapshot(): 'light' | 'dark' {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function getServerSnapshot(): 'light' | 'dark' {
    return 'light';
}

export function useDaisyTheme(): 'light' | 'dark' {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
