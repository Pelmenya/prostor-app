'use client';

import { useState } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const ITEMS: ReadonlyArray<{ color: string; label: string }> = [
    { color: '#22c55e', label: 'В норме (≤ ПДК)' },
    { color: '#eab308', label: 'На границе ПДК' },
    { color: '#f97316', label: 'Возможно проблема' },
    { color: '#ef4444', label: 'Превышение ПДК' },
];

/**
 * Compact легенда поверх карты с 4-level severity. По дефолту раскрыта,
 * на тап `i` сворачивается до маленькой кнопки чтобы не заслонять карту.
 *
 * Position: absolute right-bottom, над FAB. Semi-transparent с backdrop-blur
 * чтобы читалась поверх любого фона тёплой/холодной карты.
 */
export function SeverityLegend() {
    const [open, setOpen] = useState(true);

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Показать легенду"
                title="Показать легенду"
                className="pointer-events-auto absolute right-4 z-10 size-9 rounded-full bg-base-100/90 backdrop-blur-md shadow-md border border-base-content/10 flex items-center justify-center text-base-content/70 hover:text-primary transition"
                style={{ bottom: 'calc(env(safe-area-inset-bottom, 0) + 5.5rem)' }}
            >
                <InformationCircleIcon className="size-5" />
            </button>
        );
    }

    return (
        <aside
            className="pointer-events-auto absolute right-4 z-10 rounded-xl bg-base-100/90 backdrop-blur-md shadow-md border border-base-content/10 p-2.5 w-44"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0) + 5.5rem)' }}
            aria-label="Легенда уровней"
        >
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/60">
                    Уровни
                </span>
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Свернуть легенду"
                    className="text-base-content/40 hover:text-base-content/70 text-base leading-none px-1"
                >
                    ✕
                </button>
            </div>
            <ul className="space-y-1">
                {ITEMS.map((it) => (
                    <li key={it.color} className="flex items-center gap-2">
                        <span
                            className="block size-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: it.color }}
                            aria-hidden
                        />
                        <span className="text-[11px] text-base-content/80 leading-tight">
                            {it.label}
                        </span>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
