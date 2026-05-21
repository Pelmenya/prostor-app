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
 * Compact легенда 4-level severity. По дефолту раскрыта, на ✕ сворачивается
 * до маленькой круглой кнопки `i` чтобы не заслонять карту.
 *
 * Position-агностик — ожидает что родитель (LegendsStack в water-map-page)
 * сам position'ит компоненты в общий flex-стек. Так избегаем overlap'ов
 * при показе нескольких легенд одновременно (severity + aquifer).
 */
export function SeverityLegend() {
    const [open, setOpen] = useState(true);

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Показать легенду уровней"
                title="Показать легенду уровней"
                className="pointer-events-auto self-end size-12 rounded-full bg-base-100/90 backdrop-blur-md shadow-md border border-base-content/10 flex items-center justify-center text-base-content/70 hover:text-primary transition"
            >
                <InformationCircleIcon className="size-5" />
            </button>
        );
    }

    return (
        <aside
            className="pointer-events-auto rounded-xl bg-base-100/90 backdrop-blur-md shadow-md border border-base-content/10 p-2.5 w-56"
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
                    className="text-base-content/40 hover:text-base-content/70 text-base leading-none min-w-11 min-h-11 -m-2 flex items-center justify-center"
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
