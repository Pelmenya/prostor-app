'use client';

import { MinusIcon, PlusIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import type { Map as MaplibreMap } from 'maplibre-gl';

/**
 * Right-side toolbar — group Слои + Zoom +/− в одну vertical glass panel
 * (Apple Maps style). Design uplift 2026-05-18 (Artifact 3): раньше Слои
 * был отдельным button в `WaterMapTopBar` top-right + `MapZoomControls`
 * отдельной vertical panel middle-right. Теперь — единая `glass panel
 * rounded-2xl shadow-md` с 3 grouped controls.
 *
 * Position: absolute right-4, top:4rem (под status-bar / slim header pill).
 * Каждый control 44×44 (touch-friendly), divider между Слои и Zoom для
 * visual grouping (Слои = layer-view, Zoom = navigation).
 */

type TProps = {
    map: MaplibreMap | null;
    onToggleLayers: () => void;
    layersOpen?: boolean;
};

export function RightSideToolbar({ map, onToggleLayers, layersOpen }: TProps) {
    return (
        <div
            className="pointer-events-auto absolute right-4 z-10 flex flex-col rounded-2xl bg-base-100/95 backdrop-blur-md shadow-md border border-base-content/10 overflow-hidden"
            style={{ top: 'calc(env(safe-area-inset-top, 0) + 4rem)' }}
        >
            <button
                type="button"
                onClick={onToggleLayers}
                aria-label="Слои"
                aria-pressed={layersOpen}
                className={`size-11 flex items-center justify-center transition ${
                    layersOpen
                        ? 'text-primary bg-primary/8'
                        : 'text-base-content/80 hover:bg-base-content/8'
                }`}
            >
                <Squares2X2Icon className="size-5" />
            </button>
            {/* Divider — visual grouping: Слои (layer-view) vs Zoom (navigation) */}
            <div className="h-px bg-base-content/10" />
            <button
                type="button"
                onClick={() => map?.zoomIn()}
                aria-label="Приблизить"
                disabled={!map}
                className="size-11 flex items-center justify-center text-base-content/80 hover:bg-base-content/8 transition disabled:opacity-40"
            >
                <PlusIcon className="size-5" />
            </button>
            <div className="h-px bg-base-content/10" />
            <button
                type="button"
                onClick={() => map?.zoomOut()}
                aria-label="Отдалить"
                disabled={!map}
                className="size-11 flex items-center justify-center text-base-content/80 hover:bg-base-content/8 transition disabled:opacity-40"
            >
                <MinusIcon className="size-5" />
            </button>
        </div>
    );
}
