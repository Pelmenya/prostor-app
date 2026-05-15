'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPinIcon } from '@heroicons/react/24/outline';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { useDaisyTheme, useMediaQuery } from '@/shared/lib';
import { WaterDrop } from '@/shared/ui';
import { useClientPinStore, useWaterMapStore } from '../model';
import { AquiferLegend } from './aquifer-legend';
import { AquiferStatsModal } from './aquifer-stats-modal';
import { AutoEquipmentCard } from './auto-equipment-card';
import { RealEstatePicker } from './real-estate-picker';
import { StorePopup } from './store-popup';
import { CellPopup } from './cell-popup';
import { DepthPopup } from './depth-popup';
import { EquipmentModal } from './equipment-modal';
import { LayerPanel } from './layer-panel';
import { MapZoomControls } from './map-zoom-controls';
import { PointPopup } from './point-popup';
import { PredictModal } from './predict-modal';
import { SeverityLegend } from './severity-legend';
import { SimilarFab } from './similar-fab';
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
    // FTUX dismiss — session-only через exit-link «Или посмотрите без пина →».
    // Не персистим: после refresh юзер ещё не выставил пин → hint снова полезен.
    const [ftuxDismissed, setFtuxDismissed] = useState(false);
    const selectedCellCoords = useWaterMapStore((s) => s.selectedCellCoords);
    const activeLayers = useWaterMapStore((s) => s.activeLayers);
    const pinPlacementMode = useWaterMapStore((s) => s.pinPlacementMode);
    const setPinPlacementMode = useWaterMapStore((s) => s.setPinPlacementMode);
    const pin = useClientPinStore((s) => s.pin);
    const setPin = useClientPinStore((s) => s.setPin);

    const heatmapVisible = activeLayers.has('heatmap');
    const depthVisible = activeLayers.has('depthMap');

    const showPinHint = !pin && !pinPlacementMode && !ftuxDismissed;

    const requestGeolocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPin({
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    source: 'geolocation',
                    label: 'Текущее местоположение',
                });
            },
            () => {},
            { enableHighAccuracy: false, timeout: 5000 },
        );
    };

    return (
        <div
            data-fullscreen-map
            className="relative size-full bg-base-200 overflow-hidden overscroll-none"
        >
            <WaterMapCanvas
                theme={theme}
                onPointClick={(coords, properties) => setSelectedPoint({ coords, properties })}
                onDepthClick={(coords, properties) => setSelectedDepth({ coords, properties })}
                onStoreClick={(coords, properties) => setSelectedStore({ coords, properties })}
                onMapReady={setMap}
            />

            <WaterMapTopBar
                onToggleLayers={() => setUserOverride(!layersOpen)}
                layersOpen={layersOpen}
                subtitle="Москва и Подмосковье · 15 504 анализа"
            />

            <MapZoomControls map={map} />

            {/* Pin placement mode banner — instructs user куда тапать */}
            {pinPlacementMode && (
                <div
                    className="pointer-events-auto absolute left-1/2 -translate-x-1/2 z-20 rounded-full bg-primary text-primary-content shadow-lg px-4 py-2 flex items-center gap-3"
                    style={{ top: 'calc(env(safe-area-inset-top, 0) + 4.5rem)' }}
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

            <AutoEquipmentCard />

            <CellPopup coords={selectedCellCoords} />

            <PointPopup data={selectedPoint} onClose={() => setSelectedPoint(null)} />
            <DepthPopup data={selectedDepth} onClose={() => setSelectedDepth(null)} />
            <StorePopup data={selectedStore} onClose={() => setSelectedStore(null)} />

            <PredictModal />
            <EquipmentModal />
            <AquiferStatsModal />

            {/* FTUX hint (P1.6 Variant C) — orientation-oriented header
                «Узнайте, что у вас в воде» вместо action-oriented «Поставьте пин».
                Иконка-пин — semantic привязка к «месту». Exit-link
                «Или посмотрите без пина →» для юзеров, кто хочет просто
                посмотреть карту без обязательств. */}
            {showPinHint && (
                <div
                    className="pointer-events-auto absolute left-2 right-2 z-10 rounded-xl bg-base-100/95 backdrop-blur-md shadow-md border border-primary/30 px-3 py-3 flex flex-col gap-3 lg:left-[376px] lg:right-auto lg:max-w-sm"
                    style={{ bottom: 'calc(env(safe-area-inset-bottom, 0) + 5.5rem)' }}
                >
                    <div className="flex items-start gap-3">
                        <span className="shrink-0 inline-flex items-center justify-center size-9 rounded-full bg-primary/15 text-primary mt-0.5">
                            <MapPinIcon className="size-5" />
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-base-content leading-tight">
                                Узнайте, что у вас в воде
                            </p>
                            <p className="text-xs text-base-content/60 leading-snug mt-0.5">
                                Прогноз химии и подбор фильтра по соседним анализам.
                            </p>
                        </div>
                    </div>

                    <RealEstatePicker />

                    <button
                        type="button"
                        onClick={requestGeolocation}
                        className="btn btn-primary btn-sm w-full gap-1.5 normal-case"
                    >
                        <span className="size-4 inline-block">
                            <WaterDrop size={16} />
                        </span>
                        Узнать химию воды по адресу
                    </button>

                    <button
                        type="button"
                        onClick={() => setFtuxDismissed(true)}
                        className="text-xs text-base-content/55 hover:text-base-content text-center -mt-1 transition"
                    >
                        Или посмотрите без пина →
                    </button>
                </div>
            )}
        </div>
    );
}
