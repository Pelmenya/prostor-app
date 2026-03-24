'use client';

import { useSyncExternalStore } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

type TTheme = 'light' | 'dark';

function subscribe(callback: () => void) {
    const observer = new MutationObserver(callback);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
}

function getSnapshot(): TTheme {
    return (document.documentElement.getAttribute('data-theme') ?? 'light') as TTheme;
}

function getServerSnapshot(): TTheme {
    return 'light';
}

export function ThemeToggle() {
    const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const toggle = () => {
        const next: TTheme = theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    };

    return (
        <button
            onClick={toggle}
            className="btn btn-ghost btn-sm btn-square"
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
        >
            {theme === 'dark' ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
        </button>
    );
}
