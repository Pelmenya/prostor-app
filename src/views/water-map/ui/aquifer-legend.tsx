'use client';

import { useState } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { AQUIFER_LAYERS } from '../lib';

/**
 * Compact легенда aquifer-цветов (5 водоносных горизонтов). По дефолту
 * раскрыта, на ✕ сворачивается до круглой кнопки `i`.
 *
 * Position-агностик — родитель (LegendsStack в water-map-page) сам
 * стекирует легенды в общий flex-column. Каждый компонент здесь только
 * рисуется в потоке родителя, без absolute-позиционирования.
 */
export function AquiferLegend() {
    const [open, setOpen] = useState(true);

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Показать легенду горизонтов"
                title="Показать легенду горизонтов"
                className="pointer-events-auto self-end size-9 rounded-full bg-base-100/90 backdrop-blur-md shadow-md border border-base-content/10 flex items-center justify-center text-base-content/70 hover:text-primary transition"
            >
                <InformationCircleIcon className="size-5" />
            </button>
        );
    }

    return (
        <aside
            className="pointer-events-auto rounded-xl bg-base-100/90 backdrop-blur-md shadow-md border border-base-content/10 p-2.5 w-56"
            aria-label="Легенда водоносных горизонтов"
        >
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/60">
                    Горизонты
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
                {AQUIFER_LAYERS.map((layer) => (
                    <li key={layer.id} className="flex items-center gap-2">
                        <span
                            className="block size-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: layer.color }}
                            aria-hidden
                        />
                        <span className="text-[11px] text-base-content/80 leading-tight">
                            {layer.label}
                        </span>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
