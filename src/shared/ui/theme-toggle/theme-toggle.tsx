'use client';

import { useDaisyTheme } from '@/shared/lib';

/**
 * Переключатель темы light/dark.
 * `useDaisyTheme` — общий хук подписки на data-theme через
 * useSyncExternalStore (без hydration mismatch).
 */
export function ThemeToggle() {
    const isDark = useDaisyTheme() === 'dark';

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
            className="toggle toggle-primary toggle-sm theme-controller"
            value="dark"
            aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
            checked={isDark}
            onChange={handleChange}
        />
    );
}
