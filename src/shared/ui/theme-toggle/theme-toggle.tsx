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

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem('theme')) {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    };
    mq.addEventListener('change', handleChange);

    return () => {
        observer.disconnect();
        mq.removeEventListener('change', handleChange);
    };
}

function getSnapshot(): TTheme {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function getServerSnapshot(): TTheme {
    return 'light';
}

export function ThemeToggle() {
    const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const toggle = () => {
        const next: TTheme = theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        try {
            localStorage.setItem('theme', next);
        } catch {}
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
