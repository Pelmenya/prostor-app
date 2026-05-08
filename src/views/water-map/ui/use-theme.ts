'use client';

import { useSyncExternalStore } from 'react';

/**
 * Подписка на data-theme на <html> через `useSyncExternalStore` —
 * правильная stable-API для синхронизации с external mutable source
 * (browser DOM-attribute) без `setState` в эффекте (React-19 правило
 * react-hooks/set-state-in-effect).
 *
 * SSR snapshot = 'light' (default daisyui тема). После hydration
 * client snapshot читает фактический attribute и обновляется при
 * каждом MutationObserver tick'е.
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
