'use client';

import { useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window === 'undefined') return false;
        return document.documentElement.getAttribute('data-theme') === 'dark';
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dark = e.target.checked;
        setIsDark(dark);
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
