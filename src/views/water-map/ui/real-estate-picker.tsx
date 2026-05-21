'use client';

import { Suspense, useSyncExternalStore } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useRealEstates, TYPE_ICONS, TYPE_NAMES } from '@/entities/real-estate';
import { useAuth } from '@/shared/lib/platform';
import type { TRealEstate } from '@/shared/model';
import { useClientPinStore } from '../model';

/**
 * Список real-estate юзера для multi-pin выбора в empty-state карты.
 *
 * Архитектура:
 *  - Внешний компонент проверяет auth + mounted-flag — не рендерит ничего
 *    до hydration, чтобы избежать hydration mismatch (SSR без auth state,
 *    client после mount имеет accessToken).
 *  - Внутренний `RealEstateList` использует `useRealEstates()` (suspense).
 *  - Если 0 объектов или у всех coordinates=null → возвращает null, parent
 *    fallback'ит на FTUX-геолокацию.
 */

const NOOP_SUBSCRIBE = () => () => {};

export function RealEstatePicker({ onPicked }: { onPicked?: () => void }) {
    // SSR snapshot=false, client после hydration=true. SSR и initial client
    // render одинаково возвращают null — hydration matches.
    const mounted = useSyncExternalStore(
        NOOP_SUBSCRIBE,
        () => true,
        () => false,
    );
    const { isAuthenticated } = useAuth();
    if (!mounted || !isAuthenticated) return null;
    return (
        <Suspense fallback={null}>
            <RealEstateList onPicked={onPicked} />
        </Suspense>
    );
}

function RealEstateList({ onPicked }: { onPicked?: () => void }) {
    const { data } = useRealEstates();
    const pin = useClientPinStore((s) => s.pin);
    const setPin = useClientPinStore((s) => s.setPin);

    const withCoords = data.filter((re) => re.coordinates !== null);
    if (withCoords.length === 0) return null;

    const handlePick = (re: TRealEstate) => {
        const coords = re.coordinates;
        if (!coords) return;
        setPin({
            lat: coords.coordinates[1],
            lon: coords.coordinates[0],
            source: 'real-estate',
            label: re.address,
            realEstateId: re.id,
        });
        onPicked?.();
    };

    return (
        <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-base-content/50">
                Ваши объекты
            </p>
            <ul className="space-y-1">
                {withCoords.map((re) => {
                    const Icon = TYPE_ICONS[re.activeType];
                    const isSelected = pin?.realEstateId === re.id;
                    return (
                        <li key={re.id}>
                            <button
                                type="button"
                                onClick={() => handlePick(re)}
                                className={`w-full text-left rounded-lg border px-2.5 py-2 transition flex items-center gap-2 ${
                                    isSelected
                                        ? 'bg-primary/10 border-primary'
                                        : 'bg-base-100 border-base-content/10 hover:border-primary/40'
                                }`}
                            >
                                <Icon
                                    className={`size-4 shrink-0 ${isSelected ? 'text-primary' : 'text-base-content/60'}`}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-base-content leading-tight">
                                        {TYPE_NAMES[re.activeType]}
                                    </div>
                                    <div className="text-[11px] text-base-content/60 leading-tight truncate">
                                        {re.address}
                                    </div>
                                </div>
                                {isSelected && (
                                    <CheckCircleIcon className="size-4 text-primary shrink-0" />
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
