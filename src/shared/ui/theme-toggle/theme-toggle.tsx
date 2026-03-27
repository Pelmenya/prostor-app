'use client';

import { useSyncExternalStore } from 'react';

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
        <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
            checked={isDark}
            onChange={handleChange}
        />
    );
}
