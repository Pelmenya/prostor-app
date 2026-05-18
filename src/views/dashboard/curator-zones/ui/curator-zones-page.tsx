'use client';

import { useState } from 'react';
import { useGetZones, ZoneMap, type TServiceZone } from '@/entities/service-zone';
import { PageContainer, PageTitle, QueryBoundary } from '@/shared/ui';

export function CuratorZonesPage() {
    return (
        <PageContainer bg="bg-base-200">
            <QueryBoundary errorMessage="Ошибка загрузки зон">
                <ZonesContent />
            </QueryBoundary>
        </PageContainer>
    );
}

function ZonesContent() {
    const { data: zones } = useGetZones();
    const [focusedId, setFocusedId] = useState<number | null>(null);

    const activeZones = zones.filter((z) => z.isActive);
    const totalMasters = zones.reduce((sum, z) => sum + z.masterCount, 0);
    const selectedIds = focusedId !== null ? [focusedId] : zones.map((z) => z.id);

    const handleToggle = (id: number) => setFocusedId((prev) => (prev === id ? null : id));

    return (
        <div className="flex flex-col gap-4 max-w-2xl mx-auto py-4">
            <div className="flex items-center justify-between gap-4">
                <PageTitle>Зоны обслуживания</PageTitle>
                <span className="text-sm text-base-content/50">
                    {activeZones.length} / {zones.length} активных
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <StatCard label="Зоны" value={zones.length} />
                <StatCard label="Мастеров" value={totalMasters} />
            </div>

            <ZoneMap zones={zones} selectedZoneIds={selectedIds} onToggle={handleToggle} />

            {focusedId !== null && (
                <button
                    className="btn btn-sm btn-ghost self-center"
                    onClick={() => setFocusedId(null)}
                >
                    Показать все зоны
                </button>
            )}

            <div className="flex flex-col gap-2">
                {zones.map((zone) => (
                    <ZoneCard
                        key={zone.id}
                        zone={zone}
                        isFocused={focusedId === zone.id}
                        onFocus={handleToggle}
                    />
                ))}
            </div>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-1">
            <span className="text-2xl font-bold">{value}</span>
            <span className="text-xs text-base-content/50">{label}</span>
        </div>
    );
}

function ZoneCard({
    zone,
    isFocused,
    onFocus,
}: {
    zone: TServiceZone;
    isFocused: boolean;
    onFocus: (id: number) => void;
}) {
    const fillPercent =
        zone.maxMasters && zone.maxMasters > 0
            ? Math.min(100, Math.round((zone.masterCount / zone.maxMasters) * 100))
            : null;

    return (
        <button
            className={`card bg-base-100 p-4 text-left w-full transition-all ${
                isFocused ? 'ring-2 ring-primary/40' : ''
            }`}
            onClick={() => onFocus(zone.id)}
        >
            <div className="flex items-center gap-3">
                <div
                    className="size-3 rounded-full shrink-0"
                    style={{ backgroundColor: zone.isActive ? zone.color : '#9CA3AF' }}
                />
                <span
                    className={`font-medium text-sm flex-1 min-w-0 text-left ${
                        !zone.isActive ? 'line-through text-base-content/40' : ''
                    }`}
                >
                    {zone.name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                    {!zone.isActive && (
                        <span className="badge badge-sm badge-ghost">Неактивна</span>
                    )}
                    <span className="text-xs text-base-content/50">
                        {zone.masterCount}
                        {zone.maxMasters ? ` / ${zone.maxMasters}` : ''} мастеров
                    </span>
                </div>
            </div>
            {fillPercent !== null && (
                <div className="mt-2 ml-6">
                    <progress
                        className="progress progress-primary w-full h-1.5"
                        value={fillPercent}
                        max={100}
                    />
                </div>
            )}
        </button>
    );
}
