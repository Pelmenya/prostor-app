'use client';

import { useState } from 'react';
import { XMarkIcon, MapPinIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useWaterMapStore } from '../model';
import { StoreDetailsSheet } from './store-details-sheet';

type TStorePopupData = {
    coords: [number, number];
    properties: Record<string, unknown>;
};

type TStorePopupProps = {
    data: TStorePopupData | null;
    onClose: () => void;
};

/**
 * Floating mini-popup для тапа на store marker. В отличие от BottomSheetModal
 * этот не блокирует UI — компактный card в углу карты с базовыми данными +
 * кнопкой «Маршрут». Юзер может закрыть крестиком и продолжить смотреть карту.
 *
 * Source — `useNearestRetailStores` через водо-карту canvas. properties shape
 * из storesToFeatureCollection: id / name / address / duration / distance /
 * availability / organizationName.
 */
export function StorePopup({ data, onClose }: TStorePopupProps) {
    const setSelectedRouteTo = useWaterMapStore((s) => s.setSelectedRouteTo);
    const selectedRouteTo = useWaterMapStore((s) => s.selectedRouteTo);
    const [detailsOpen, setDetailsOpen] = useState(false);
    if (!data) return null;

    const props = data.properties as {
        id?: string;
        name?: string;
        address?: string;
        duration?: number;
        distance?: number;
        availability?: 'full' | 'partial';
        organizationName?: string | null;
    };

    const availabilityLabel =
        props.availability === 'full' ? 'Полный ассортимент' : 'Частичный ассортимент';
    const availabilityCls =
        props.availability === 'full'
            ? 'bg-success/15 text-success ring-success/30'
            : 'bg-warning/15 text-warning ring-warning/30';

    const durationLabel = formatDuration(props.duration);
    const distanceLabel = formatDistance(props.distance);

    // Маршрут — native polyline через wm-route layer от pin'а к точке.
    // `data.coords` = [lat, lon]; backend ждёт [lng, lat] (GeoJSON order).
    const [lat, lon] = data.coords;
    const isActiveRoute =
        selectedRouteTo !== null &&
        Math.abs(selectedRouteTo[0] - lon) < 1e-6 &&
        Math.abs(selectedRouteTo[1] - lat) < 1e-6;

    const handleRoute = () => {
        if (isActiveRoute) {
            setSelectedRouteTo(null);
        } else {
            setSelectedRouteTo([lon, lat]);
        }
    };

    return (
        <div
            className="pointer-events-auto absolute left-2 right-2 z-10 rounded-xl bg-base-100/95 backdrop-blur-md shadow-lg border border-base-content/10 p-3 lg:left-auto lg:right-4 lg:bottom-4 lg:w-80"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0) + 5.5rem)' }}
        >
            <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-bold text-base-content leading-tight flex-1 min-w-0">
                    {props.name ?? 'Точка продаж'}
                </h4>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Закрыть"
                    className="rounded-full p-1 hover:bg-base-200 text-base-content/70 shrink-0 -mr-1 -mt-1"
                >
                    <XMarkIcon className="size-4" />
                </button>
            </div>

            <p className="text-xs text-base-content/70 leading-snug mb-2">
                {props.address ?? '—'}
                {props.organizationName && (
                    <>
                        <br />
                        <span className="text-base-content/55">{props.organizationName}</span>
                    </>
                )}
            </p>

            <div className="flex items-center gap-2 text-[11px] text-base-content/70 mb-2">
                <span
                    className={`inline-flex items-center rounded-full ring-1 px-2 py-0.5 font-medium text-[10px] ${availabilityCls}`}
                >
                    {availabilityLabel}
                </span>
                {durationLabel && <span>{durationLabel} в пути</span>}
                {distanceLabel && <span>· {distanceLabel}</span>}
            </div>

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={handleRoute}
                    className={`btn btn-sm flex-1 gap-1.5 normal-case ${
                        isActiveRoute ? 'btn-outline btn-primary' : 'btn-primary'
                    }`}
                >
                    <MapPinIcon className="size-4" />
                    {isActiveRoute ? 'Скрыть' : 'Маршрут'}
                </button>
                <button
                    type="button"
                    onClick={() => setDetailsOpen(true)}
                    className="btn btn-sm btn-ghost gap-1 normal-case"
                    aria-label="Подробнее"
                >
                    <ChevronUpIcon className="size-4" />
                    Детали
                </button>
            </div>

            <StoreDetailsSheet
                isOpen={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                coords={data.coords}
                storeMoySkladId={props.id ?? null}
                storeName={props.name ?? null}
                storeAddress={props.address ?? null}
                durationSeconds={
                    typeof props.duration === 'number' && Number.isFinite(props.duration)
                        ? props.duration
                        : null
                }
                distanceMeters={
                    typeof props.distance === 'number' && Number.isFinite(props.distance)
                        ? props.distance
                        : null
                }
            />
        </div>
    );
}

/**
 * OSRM возвращает duration в **секундах**, не минутах. Переводим в минуты
 * для human-friendly отображения.
 */
function formatDuration(seconds: number | undefined): string | null {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return null;
    const min = seconds / 60;
    if (min < 1) return '< 1 мин';
    if (min < 60) return `${Math.round(min)} мин`;
    const h = Math.floor(min / 60);
    const rest = Math.round(min % 60);
    return rest === 0 ? `${h} ч` : `${h} ч ${rest} мин`;
}

function formatDistance(meters: number | undefined): string | null {
    if (typeof meters !== 'number' || !Number.isFinite(meters)) return null;
    if (meters < 1000) return `${Math.round(meters)} м`;
    return `${(meters / 1000).toFixed(1)} км`;
}
