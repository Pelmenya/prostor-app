'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    HomeModernIcon,
    PencilSquareIcon,
    PlusCircleIcon,
    DocumentTextIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/outline';
import {
    useRealEstate,
    getRealEstateTypeName,
    getWaterSourceName,
    TYPE_ICONS,
} from '@/entities/real-estate';
import {
    EquipmentCard,
    ArchivedEquipmentRow,
    useInstalledEquipmentByRealEstate,
    useUpdateInstalledEquipment,
    getResourcePercent,
    getDaysLeft,
} from '@/entities/installed-equipment';
import { useProductThumbnails } from '@/entities/product';
import { PageContainer, PageTitle } from '@/shared/ui';
import { AddEquipmentModal, ComponentRow } from '@/features/installed-equipment';
import type { TInstalledEquipment } from '@/shared/model';

type TAddressDetailPageProps = {
    id: number;
};

/** Гарантийные документы — мок */
const MOCK_WARRANTY_DOCS = [
    { id: '1', name: 'Гарантийный талон — Аквафор Трио', url: '#' },
    { id: '2', name: 'Гарантийный талон — EcoWater ERR 3500', url: '#' },
];

/** Самый критичный компонент среди всего оборудования (минимум дней до замены) */
function getCriticalDaysLeft(equipment: TInstalledEquipment[]): number | null {
    const components = equipment.flatMap((e) => e.components.filter((c) => !c.isReplaced));
    if (components.length === 0) return null;
    return Math.min(...components.map((c) => getDaysLeft(c.nextReplacementDate)));
}

function getCriticalPercent(equipment: TInstalledEquipment[]): number {
    const components = equipment.flatMap((e) => e.components.filter((c) => !c.isReplaced));
    if (components.length === 0) return 100;
    const percents = components.map((c) =>
        getResourcePercent(c.installedAt, c.nextReplacementDate),
    );
    return Math.min(...percents);
}

export function AddressDetailPage({ id }: TAddressDetailPageProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const { data: realEstate, isLoading, error } = useRealEstate(id);
    const { data: equipment = [] } = useInstalledEquipmentByRealEstate(id);
    const { mutate: updateEquipment } = useUpdateInstalledEquipment(id);

    const activeEquipment = equipment.filter((e) => e.isActive);
    const archivedEquipment = equipment.filter((e) => !e.isActive);
    const { imageUrls, loadingIds } = useProductThumbnails(
        activeEquipment.map((e) => e.msProductId),
    );

    if (isLoading)
        return (
            <PageContainer className="flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary" />
            </PageContainer>
        );

    if (error || !realEstate)
        return (
            <PageContainer className="flex items-center justify-center">
                <p className="text-error font-medium">Ошибка загрузки адреса</p>
            </PageContainer>
        );

    const Icon = TYPE_ICONS[realEstate.activeType] ?? HomeModernIcon;
    const criticalDays = getCriticalDaysLeft(activeEquipment);
    const criticalPercent = getCriticalPercent(activeEquipment);
    const progressColor =
        criticalPercent >= 50
            ? 'progress-success'
            : criticalPercent >= 20
              ? 'progress-warning'
              : 'progress-error';

    return (
        <PageContainer>
            <PageTitle>{getRealEstateTypeName(realEstate.activeType)}</PageTitle>
            <div className="flex flex-col gap-4 pb-4 max-w-lg mx-auto w-full">
                {/* Карточка адреса */}
                <div className="flex items-center gap-3 p-4 bg-base-100 border border-base-300 rounded-2xl">
                    <Icon className="size-10 text-primary shrink-0" />
                    <div className="divider divider-horizontal m-0 shrink-0 self-stretch" />
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold leading-110">
                                {realEstate.address || 'Адрес не указан'}
                            </p>
                            <Link
                                href={`/real-estate/${id}/edit`}
                                className="btn btn-ghost btn-sm btn-square"
                                aria-label="Редактировать адрес"
                            >
                                <PencilSquareIcon className="size-5" />
                            </Link>
                        </div>

                        <div className="flex gap-2 text-xs text-base-content/50">
                            <span>{realEstate.residents} чел.</span>
                            <span>{getWaterSourceName(realEstate.activeSource)}</span>
                        </div>

                        {criticalDays !== null && (
                            <div className="flex flex-col gap-1 mt-1">
                                <progress
                                    className={`progress ${progressColor} h-1 w-full`}
                                    value={criticalPercent}
                                    max={100}
                                />
                                <span className="text-xs text-base-content/40">
                                    Ближайшая замена через{' '}
                                    <span
                                        className={
                                            criticalDays < 7
                                                ? 'text-error font-semibold'
                                                : criticalDays < 30
                                                  ? 'text-warning font-semibold'
                                                  : 'text-base-content/60'
                                        }
                                    >
                                        {criticalDays} дн.
                                    </span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Оборудование */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-base">Оборудование</h2>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm gap-1 text-primary"
                            onClick={() => setIsAddOpen(true)}
                        >
                            <PlusCircleIcon className="size-4" />
                            <span className="text-sm font-semibold">Добавить</span>
                        </button>
                    </div>

                    {activeEquipment.length === 0 && (
                        <div className="p-8 bg-base-100 border border-base-300 rounded-2xl text-center">
                            <p className="text-base-content/50 text-sm mb-3">
                                Оборудование не добавлено
                            </p>
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => setIsAddOpen(true)}
                            >
                                Добавить первое
                            </button>
                        </div>
                    )}

                    {activeEquipment.map((item) => (
                        <EquipmentCard
                            key={item.id}
                            equipment={item}
                            imageUrl={imageUrls[item.msProductId]}
                            isImageLoading={loadingIds.has(item.msProductId)}
                            onDemount={() =>
                                updateEquipment({ id: item.id, data: { isActive: false } })
                            }
                            renderComponent={(c) => <ComponentRow key={c.id} component={c} />}
                        />
                    ))}

                    {/* Архив оборудования */}
                    {archivedEquipment.length > 0 && (
                        <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
                            <button
                                type="button"
                                className="flex items-center justify-between w-full px-4 py-3 text-left"
                                onClick={() => setIsArchiveOpen((v) => !v)}
                            >
                                <span className="text-sm text-base-content/50 font-medium">
                                    Архив оборудования ({archivedEquipment.length})
                                </span>
                                <ChevronDownIcon
                                    className={`size-4 text-base-content/30 transition-transform ${isArchiveOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {isArchiveOpen && (
                                <div className="flex flex-col divide-y divide-base-200 px-4 pb-3">
                                    {archivedEquipment.map((item) => (
                                        <ArchivedEquipmentRow key={item.id} equipment={item} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Гарантийные документы */}
                {MOCK_WARRANTY_DOCS.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h2 className="font-semibold text-base">Гарантийные документы</h2>
                        <div className="flex flex-col gap-2 p-4 bg-base-100 border border-base-300 rounded-2xl">
                            {MOCK_WARRANTY_DOCS.map((doc, idx) => (
                                <a
                                    key={doc.id}
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-3 py-2 text-sm hover:text-primary transition-colors ${idx > 0 ? 'border-t border-base-200' : ''}`}
                                >
                                    <DocumentTextIcon className="size-5 shrink-0 text-base-content/40" />
                                    <span className="flex-1 line-clamp-1">{doc.name}</span>
                                    <span className="text-xs text-base-content/40">PDF →</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <AddEquipmentModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                realEstateId={id}
            />
        </PageContainer>
    );
}
