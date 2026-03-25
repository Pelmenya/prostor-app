'use client';

import { useSyncExternalStore } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

function getTheme(): boolean {
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

/**
 * Переключатель темы light/dark.
 * useSyncExternalStore гарантирует отсутствие hydration mismatch:
 * SSR всегда рендерит light, клиент подхватывает реальную тему.
 */
export function ThemeToggle() {
    const isDark = useSyncExternalStore(
        (onStoreChange) => {
            const observer = new MutationObserver(onStoreChange);
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['data-theme'],
            });
            return () => observer.disconnect();
        },
        () => getTheme(),
        () => false, // SSR — всегда light
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dark = e.target.checked;
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        try {
            localStorage.setItem('theme', dark ? 'dark' : 'light');
        } catch {}
    };

    return (
        <label
            className="swap swap-rotate"
            aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
        >
            <input
                type="checkbox"
                className="theme-controller"
                value="dark"
                checked={isDark}
                onChange={handleChange}
            />
            <SunIcon className="swap-off size-5" />
            <MoonIcon className="swap-on size-5" />
        </label>
    );
}
