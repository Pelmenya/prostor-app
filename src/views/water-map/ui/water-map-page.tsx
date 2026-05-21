'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { useDaisyTheme, useMediaQuery } from '@/shared/lib';
import { SmartSearchInput, SmartSearchOverlay } from '@/features/smart-search';
import { useWaterMapStore } from '../model';
import { AquiferLegend } from './aquifer-legend';
import { AquiferStatsModal } from './aquifer-stats-modal';
import { AutoEquipmentCard } from './auto-equipment-card';
import { StorePopup } from './store-popup';
import { CellPopup } from './cell-popup';
import { DepthPopup } from './depth-popup';
import { EquipmentModal } from './equipment-modal';
import { LayerPanel } from './layer-panel';
import { PointPopup } from './point-popup';
import { RightSideToolbar } from './right-side-toolbar';
import { PredictModal } from './predict-modal';
import { SeverityLegend } from './severity-legend';
import { SimilarFab } from './similar-fab';
import { WaterMapSplash } from './water-map-splash';
import { WaterMapTopBar } from './water-map-top-bar';

const WaterMapCanvas = dynamic(() => import('./water-map-canvas').then((m) => m.WaterMapCanvas), {
    ssr: false,
    loading: () => <div className="absolute inset-0 water-map-skeleton-bg" />,
});

type TCanvasSelection = {
    coords: [number, number];
    properties: Record<string, unknown>;
};

export function WaterMapPage() {
    const theme = useDaisyTheme();
    // Default: на desktop (≥lg) панель открыта, на mobile закрыта.
    // Hydration-safe через useSyncExternalStore (SSR snapshot=false, клиент
    // подхватывает реальный media-query). userOverride трекает явный toggle
    // юзером — null = «следуем дефолту», true/false = override.
    const isDesktop = useMediaQuery('(min-width: 992px)');
    const [userOverride, setUserOverride] = useState<boolean | null>(null);
    const layersOpen = userOverride ?? isDesktop;
    const [selectedPoint, setSelectedPoint] = useState<TCanvasSelection | null>(null);
    const [selectedDepth, setSelectedDepth] = useState<TCanvasSelection | null>(null);
    const [selectedStore, setSelectedStore] = useState<TCanvasSelection | null>(null);
    const [map, setMap] = useState<MaplibreMap | null>(null);
    const selectedCellCoords = useWaterMapStore((s) => s.selectedCellCoords);
    const activeLayers = useWaterMapStore((s) => s.activeLayers);
    const pinPlacementMode = useWaterMapStore((s) => s.pinPlacementMode);
    const setPinPlacementMode = useWaterMapStore((s) => s.setPinPlacementMode);

    const heatmapVisible = activeLayers.has('heatmap');
    const depthVisible = activeLayers.has('depthMap');

    return (
        <div
            data-fullscreen-map
            className="relative size-full bg-base-200 overflow-hidden overscroll-none"
        >
            <WaterMapSplash />
            <WaterMapCanvas
                theme={theme}
                onPointClick={(coords, properties) => setSelectedPoint({ coords, properties })}
                onDepthClick={(coords, properties) => setSelectedDepth({ coords, properties })}
                onStoreClick={(coords, properties) => setSelectedStore({ coords, properties })}
                onMapReady={setMap}
            />

            <WaterMapTopBar
                subtitle="15 504 анализа · Москва и Подмосковье"
                layersOpen={layersOpen}
            />

            <SmartSearchInput layersOpen={layersOpen} />

            <RightSideToolbar
                map={map}
                onToggleLayers={() => setUserOverride(!layersOpen)}
                layersOpen={layersOpen}
            />

            {/* Pin placement mode banner — instructs user куда тапать.
                top:8rem (под top-bar + SmartSearchInput sticky) — sticky-input
                занимает top:4..7rem, banner смещён ниже чтобы не overlap'ило. */}
            {pinPlacementMode && (
                <div
                    className="pointer-events-auto absolute left-1/2 -translate-x-1/2 z-20 rounded-full bg-primary text-primary-content shadow-lg px-4 py-2 flex items-center gap-3"
                    style={{ top: 'calc(env(safe-area-inset-top, 0) + 8rem)' }}
                >
                    <span className="text-sm font-medium">
                        Кликните на карте, чтобы поставить пин
                    </span>
                    <button
                        type="button"
                        onClick={() => setPinPlacementMode(false)}
                        className="text-xs underline opacity-90 hover:opacity-100"
                    >
                        Отмена
                    </button>
                </div>
            )}

            <LayerPanel open={layersOpen} onClose={() => setUserOverride(false)} />

            {/* Legends stack — vertical column в правом-нижнем углу над FAB.
                Все легенды одной ширины (w-56), складываются друг над другом
                через flex-col gap-2. Без absolute-позиционирования у каждой
                легенды отдельно — это решает overlap при двух одновременно. */}
            {(heatmapVisible || depthVisible) && (
                <div
                    className="pointer-events-none absolute right-4 z-10 flex flex-col items-end gap-2"
                    style={{ bottom: 'calc(env(safe-area-inset-bottom, 0) + 5.5rem)' }}
                >
                    {depthVisible && <AquiferLegend />}
                    {heatmapVisible && <SeverityLegend />}
                </div>
            )}

            <SimilarFab />

            <AutoEquipmentCard layersOpen={layersOpen} />

            <CellPopup coords={selectedCellCoords} />

            <PointPopup data={selectedPoint} onClose={() => setSelectedPoint(null)} />
            <DepthPopup data={selectedDepth} onClose={() => setSelectedDepth(null)} />
            <StorePopup data={selectedStore} onClose={() => setSelectedStore(null)} />

            <PredictModal />
            <EquipmentModal />
            <AquiferStatsModal />

            <SmartSearchOverlay />
        </div>
    );
}
