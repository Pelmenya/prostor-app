'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useDaisyTheme, useMediaQuery } from '@/shared/lib';
import { WaterDrop } from '@/shared/ui';
import { useClientPinStore, useWaterMapStore } from '../model';
import { AutoEquipmentCard } from './auto-equipment-card';
import { CellPopup } from './cell-popup';
import { EquipmentModal } from './equipment-modal';
import { LayerPanel } from './layer-panel';
import { PointPopup } from './point-popup';
import { PredictModal } from './predict-modal';
import { SeverityLegend } from './severity-legend';
import { SimilarFab } from './similar-fab';
import { WaterMapTopBar } from './water-map-top-bar';

const WaterMapCanvas = dynamic(() => import('./water-map-canvas').then((m) => m.WaterMapCanvas), {
    ssr: false,
    loading: () => <div className="absolute inset-0 water-map-skeleton-bg" />,
});

type TPointSelection = {
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
    const [selectedPoint, setSelectedPoint] = useState<TPointSelection | null>(null);
    const selectedCellCoords = useWaterMapStore((s) => s.selectedCellCoords);
    const pin = useClientPinStore((s) => s.pin);
    const setPin = useClientPinStore((s) => s.setPin);

    const showPinHint = !pin;

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
        <div className="relative size-full min-h-[calc(100dvh-9rem)] bg-base-200">
            <WaterMapCanvas
                theme={theme}
                onPointClick={(coords, properties) => setSelectedPoint({ coords, properties })}
            />

            <WaterMapTopBar
                onToggleLayers={() => setUserOverride(!layersOpen)}
                layersOpen={layersOpen}
                subtitle="Москва и Подмосковье · 15 504 анализа"
            />

            <LayerPanel open={layersOpen} onClose={() => setUserOverride(false)} />

            <SeverityLegend />

            <SimilarFab />

            <AutoEquipmentCard />

            <CellPopup coords={selectedCellCoords} />

            <PointPopup data={selectedPoint} onClose={() => setSelectedPoint(null)} />

            <PredictModal />
            <EquipmentModal />

            {/* FTUX hint когда пина нет — primary geolocation button */}
            {showPinHint && (
                <div
                    className="pointer-events-auto absolute left-2 right-2 z-10 rounded-xl bg-base-100/95 backdrop-blur-md shadow-md border border-primary/30 px-3 py-3 flex items-start gap-3 lg:left-[376px] lg:right-auto lg:max-w-sm"
                    style={{ bottom: 'calc(env(safe-area-inset-bottom, 0) + 5.5rem)' }}
                >
                    <span className="size-2 rounded-full bg-primary mt-1.5 shrink-0 animate-pulse" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-base-content leading-tight">
                            Поставьте пин на свой адрес
                        </p>
                        <p className="text-xs text-base-content/60 leading-snug mt-0.5 mb-2">
                            Чтобы получить прогноз воды и подбор фильтра по соседям.
                        </p>
                        <button
                            type="button"
                            onClick={requestGeolocation}
                            className="btn btn-primary btn-sm w-full gap-1.5 normal-case"
                        >
                            <span className="size-4 inline-block">
                                <WaterDrop size={16} />
                            </span>
                            Использовать геолокацию
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
