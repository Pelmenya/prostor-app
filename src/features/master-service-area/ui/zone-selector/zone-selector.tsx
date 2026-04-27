'use client';

import { useState } from 'react';
import {
    useGetZones,
    useGetMyZones,
    useUpdateMyZones,
    ZoneListItem,
    ZoneMap,
} from '@/entities/service-zone';

type TZoneSelectorProps = {
    center?: { latitude: number; longitude: number };
    onSuccess?: () => void;
};

export function ZoneSelector({ center, onSuccess }: TZoneSelectorProps) {
    const { data: allZones } = useGetZones();
    const { data: myZones } = useGetMyZones();
    const { mutate, isPending, error } = useUpdateMyZones();

    const [selection, setSelection] = useState<number[]>(() => myZones.map((z) => z.id));
    const [search, setSearch] = useState('');

    const myZoneIds = myZones.map((z) => z.id);

    const visibleZones = allZones.filter((z) => z.isActive || myZoneIds.includes(z.id));

    const filteredZones = search.trim()
        ? visibleZones.filter((z) => z.name.toLowerCase().includes(search.toLowerCase()))
        : visibleZones;

    function handleToggle(zoneId: number) {
        setSelection((prev) =>
            prev.includes(zoneId) ? prev.filter((id) => id !== zoneId) : [...prev, zoneId],
        );
    }

    function handleSave() {
        mutate(selection, { onSuccess });
    }

    return (
        <div className="flex flex-col gap-4">
            <ZoneMap
                zones={visibleZones}
                selectedZoneIds={selection}
                onToggle={handleToggle}
                center={center}
            />

            <input
                type="text"
                className="input input-bordered input-sm w-full"
                placeholder="Поиск зоны..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {visibleZones.length === 0 && (
                <p className="text-sm text-base-content/40 text-center py-4">Зоны ещё не созданы</p>
            )}

            {visibleZones.length > 0 && filteredZones.length === 0 && (
                <p className="text-sm text-base-content/40 text-center py-4">Ничего не найдено</p>
            )}

            <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto">
                {filteredZones.map((zone) => (
                    <ZoneListItem
                        key={zone.id}
                        zone={zone}
                        isSelected={selection.includes(zone.id)}
                        onToggle={handleToggle}
                    />
                ))}
            </div>

            {error && (
                <p className="text-error text-sm">Не удалось сохранить. Попробуйте ещё раз.</p>
            )}

            <button className="btn btn-primary w-full" disabled={isPending} onClick={handleSave}>
                {isPending ? (
                    <span className="loading loading-spinner loading-sm" />
                ) : (
                    `Сохранить (${selection.length})`
                )}
            </button>
        </div>
    );
}
