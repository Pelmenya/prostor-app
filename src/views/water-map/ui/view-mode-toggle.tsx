'use client';

import type { TCellsViewMode } from '../model';

const OPTIONS: ReadonlyArray<{ id: TCellsViewMode; label: string; icon: string; aria: string }> = [
    { id: 'spline', label: 'Сплайн', icon: '✨', aria: 'Только тепловая карта' },
    { id: 'dots', label: 'Точки', icon: '●', aria: 'Только отдельные точки' },
    { id: 'both', label: 'Оба', icon: '◉', aria: 'Тепловая карта и точки одновременно' },
];

type TViewModeToggleProps = {
    value: TCellsViewMode;
    onChange: (m: TCellsViewMode) => void;
};

/**
 * Segmented control для выбора режима отрисовки cells:
 *  - Spline (только heatmap, демо-режим)
 *  - Dots (только circle dots, analytical)
 *  - Both (default, оба слоя)
 *
 * Скрывает heatmap-layer / cells-layer независимо в `water-map-canvas`.
 */
export function ViewModeToggle({ value, onChange }: TViewModeToggleProps) {
    return (
        <div
            role="radiogroup"
            aria-label="Режим отображения"
            className="inline-flex rounded-full border border-base-content/15 bg-base-100 p-0.5 text-xs"
        >
            {OPTIONS.map((opt) => {
                const active = value === opt.id;
                return (
                    <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={opt.aria}
                        onClick={() => onChange(opt.id)}
                        className={`px-2.5 py-1 rounded-full font-medium transition flex items-center gap-1 ${
                            active
                                ? 'bg-primary text-primary-content shadow-sm'
                                : 'text-base-content/70 hover:text-base-content'
                        }`}
                    >
                        <span aria-hidden>{opt.icon}</span>
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}
