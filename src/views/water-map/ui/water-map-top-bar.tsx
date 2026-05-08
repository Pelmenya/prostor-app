'use client';

import { Squares2X2Icon } from '@heroicons/react/24/outline';

type TWaterMapTopBarProps = {
    onToggleLayers: () => void;
    /** Текстовый счётчик «N анализов» (опц., передаётся из page если нужен). */
    subtitle?: string;
    /** Активна ли панель layers — для toggle-icon highlight. */
    layersOpen?: boolean;
};

/**
 * Полоса поверх карты: title + кнопка layers (toggle bottom-sheet/sidebar).
 * Back arrow убрали — на /water нет родительской страницы (3-я вкладка нав-бара).
 *
 * Position: absolute поверх map (карта — full screen). Pointer-events: auto
 * только на самом баре, чтобы клики проходили на карту вне него.
 */
export function WaterMapTopBar({ onToggleLayers, subtitle, layersOpen }: TWaterMapTopBarProps) {
    return (
        <div className="pointer-events-none absolute top-2 left-2 right-2 z-10 flex items-start gap-2">
            <div className="pointer-events-auto flex-1 rounded-xl bg-base-100/95 backdrop-blur-md shadow-md border border-base-content/10 px-3 py-2 flex flex-col">
                <span className="text-sm font-bold text-base-content leading-tight">
                    Карта качества воды
                </span>
                {subtitle && (
                    <span className="text-xs text-base-content/60 leading-tight mt-0.5">
                        {subtitle}
                    </span>
                )}
            </div>
            <button
                type="button"
                onClick={onToggleLayers}
                aria-label="Слои"
                aria-pressed={layersOpen}
                className={`pointer-events-auto rounded-xl bg-base-100/95 backdrop-blur-md shadow-md border border-base-content/10 size-12 flex items-center justify-center transition ${
                    layersOpen ? 'text-primary ring-1 ring-primary/40' : 'text-base-content/80'
                }`}
            >
                <Squares2X2Icon className="size-5" />
            </button>
        </div>
    );
}
