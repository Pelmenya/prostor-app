'use client';

import { SparklesIcon } from '@heroicons/react/24/outline';
import { useClientPinStore } from '../model';

/**
 * FAB «Прогноз» — pill в bottom-right для guest-юзеров без pin'а.
 * On click: запрос геолокации → setPin → AutoEquipmentCard сама поднимется
 * с автоматическим прогнозом.
 *
 * **Auto-hide когда pin есть** (claude design followup 2026-05-15 15:00):
 * AutoEquipmentCard уже визуализирует прогноз/проблемы, FAB дублёром был
 * бы лишним 4-й «капелькой» в одном palette. Avoids visual noise.
 *
 * Icon — sparkles (AI prediction vibe), не water-drop (избежать confusion
 * с pin / AutoEquipmentCard / footer «Вода» tab — все brand-blue water-drop).
 * Shape — pill с явным label «Прогноз», чтобы юзер не путал с круглым pin.
 */
export function SimilarFab() {
    const pin = useClientPinStore((s) => s.pin);
    const setPin = useClientPinStore((s) => s.setPin);

    // С pin → AutoEquipmentCard ставит прогноз внизу, FAB скрываем
    if (pin) return null;

    const handleClick = () => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) return;
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
        <button
            type="button"
            onClick={handleClick}
            className="pointer-events-auto absolute right-4 z-10 inline-flex items-center gap-2 rounded-full bg-accent text-accent-content px-4 py-2.5 shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0) + 1rem)' }}
            aria-label="Узнать прогноз воды по моему адресу"
            title="Прогноз воды по геолокации"
        >
            <SparklesIcon className="size-5" />
            <span className="text-sm font-medium">Прогноз</span>
        </button>
    );
}
