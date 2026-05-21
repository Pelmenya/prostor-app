'use client';

import type { ComponentType } from 'react';
import type { TCellsViewMode } from '../model';
import { BothGlyph, DotsGlyph, SplineGlyph } from './view-mode-icons';

type TGlyphComponent = ComponentType<{ size?: number; className?: string }>;

const OPTIONS: ReadonlyArray<{
    id: TCellsViewMode;
    label: string;
    Glyph: TGlyphComponent;
    aria: string;
}> = [
    { id: 'spline', label: 'Сплайн', Glyph: SplineGlyph, aria: 'Только тепловая карта' },
    { id: 'dots', label: 'Точки', Glyph: DotsGlyph, aria: 'Только отдельные точки' },
    { id: 'both', label: 'Оба', Glyph: BothGlyph, aria: 'Тепловая карта и точки одновременно' },
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
 * Иконки — vector SVG (`view-mode-icons.tsx`), извлечены из claude.ai design
 * uplift mockup 2026-05-18 (Artifact 2). Active state — primary fill (как
 * раньше), inactive — base-content/70 stroke. Размер 16px под inline radio,
 * визуально совпадает с font-size текста.
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
                const { Glyph } = opt;
                return (
                    <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={opt.aria}
                        onClick={() => onChange(opt.id)}
                        className={`min-h-11 px-2.5 py-1 rounded-full font-medium transition flex items-center gap-1.5 ${
                            active
                                ? 'bg-primary text-primary-content shadow-sm'
                                : 'text-base-content/70 hover:text-base-content'
                        }`}
                    >
                        <Glyph size={16} />
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}
