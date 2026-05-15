'use client';

import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { Map as MaplibreMap } from 'maplibre-gl';

type TMapZoomControlsProps = {
    map: MaplibreMap | null;
};

/**
 * Кастомные кнопки zoom +/− для карты — выкинули MapLibre `NavigationControl`,
 * чтобы не fight'ить maplibre-gl.css через `!important` overrides. Полный
 * контроль через Tailwind, тот же look что у кнопки «Слои» (size-12 +
 * bg-base-100/95 + backdrop-blur + shadow-md + border-base-content/10).
 *
 * Позиционирование — `right-4` (1rem), выровнено с top-bar / legends /
 * SimilarFab. Top — под кнопкой «Слои» с 8px gap.
 */
export function MapZoomControls({ map }: TMapZoomControlsProps) {
    if (!map) return null;
    return (
        <div
            className="pointer-events-auto absolute right-4 z-10 flex flex-col rounded-xl bg-base-100/95 backdrop-blur-md shadow-md border border-base-content/10 overflow-hidden"
            style={{ top: 'calc(env(safe-area-inset-top, 0) + 4.5rem)' }}
        >
            <button
                type="button"
                onClick={() => map.zoomIn()}
                aria-label="Приблизить"
                className="size-12 flex items-center justify-center text-base-content/80 hover:bg-base-content/8 transition"
            >
                <PlusIcon className="size-5" />
            </button>
            <div className="h-px bg-base-content/10" />
            <button
                type="button"
                onClick={() => map.zoomOut()}
                aria-label="Отдалить"
                className="size-12 flex items-center justify-center text-base-content/80 hover:bg-base-content/8 transition"
            >
                <MinusIcon className="size-5" />
            </button>
        </div>
    );
}
