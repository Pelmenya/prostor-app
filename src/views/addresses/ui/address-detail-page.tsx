'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    HomeModernIcon,
    PencilSquareIcon,
    PlusCircleIcon,
    ChevronDownIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import {
    useRealEstate,
    useDeleteRealEstate,
    getRealEstateTypeName,
    getWaterSourceName,
    TYPE_ICONS,
} from '@/entities/real-estate';
import {
    EquipmentCard,
    ArchivedEquipmentRow,
    useInstalledEquipmentByRealEstate,
    useUpdateInstalledEquipment,
    getCriticalStats,
    getProgressColor,
} from '@/entities/installed-equipment';
import { useProductThumbnails } from '@/entities/product';
import { PageContainer, PageTitle, ConfirmDialog, PageSpinner, QueryBoundary } from '@/shared/ui';
import { useAuth } from '@/shared/lib/platform';
import { AddEquipmentModal, ComponentRow } from '@/features/installed-equipment';

type TAddressDetailPageProps = {
    id: number;
};

export function AddressDetailPage({ id }: TAddressDetailPageProps) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <PageSpinner />;
    return (
        <QueryBoundary errorMessage="Ошибка загрузки адреса" resetKeys={[id]}>
            <AddressDetailContent id={id} />
        </QueryBoundary>
    );
}

function AddressDetailContent({ id }: TAddressDetailPageProps) {
    const router = useRouter();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [demountingId, setDemountingId] = useState<string | null>(null);
    const [isDeletingAddress, setIsDeletingAddress] = useState(false);
    const { data: realEstate } = useRealEstate(id);
    const { data: equipment } = useInstalledEquipmentByRealEstate(id);
    const { mutate: updateEquipment } = useUpdateInstalledEquipment(id);
    const deleteRealEstate = useDeleteRealEstate();

    const activeEquipment = equipment.filter((e) => e.isActive);
    const archivedEquipment = equipment.filter((e) => !e.isActive);
    const canDelete = equipment.length === 0;
    const { imageUrls, loadingIds } = useProductThumbnails(
        activeEquipment.map((e) => e.msProductId),
    );

    const handleConfirmDeleteAddress = async () => {
        await deleteRealEstate.mutateAsync(id);
        router.push('/real-estate');
    };

    const Icon = TYPE_ICONS[realEstate.activeType] ?? HomeModernIcon;
    const stats = getCriticalStats(activeEquipment);
    const progressColor = stats ? getProgressColor(stats.percent) : null;

    const handleConfirmDemount = () => {
        if (!demountingId) return;
        updateEquipment({ id: demountingId, data: { isActive: false } });
        setDemountingId(null);
    };

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
                            <p className="text-sm font-semibold leading-[110%]">
                                {realEstate.address || 'Адрес не указан'}
                            </p>
                            <div className="flex items-center gap-1">
                                <Link
                                    href={`/real-estate/${id}/edit`}
                                    className="btn btn-ghost btn-sm btn-square"
                                    aria-label="Редактировать адрес"
                                >
                                    <PencilSquareIcon className="size-5" />
                                </Link>
                                {canDelete && (
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm btn-square"
                                        aria-label="Удалить адрес"
                                        onClick={() => setIsDeletingAddress(true)}
                                    >
                                        <TrashIcon className="size-5 text-error" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 text-xs text-base-content/50">
                            <span>{realEstate.residents} чел.</span>
                            <span>{getWaterSourceName(realEstate.activeSource)}</span>
                        </div>

                        {stats && progressColor && (
                            <div className="flex flex-col gap-1 mt-1">
                                <progress
                                    className={`progress ${progressColor} h-1 w-full`}
                                    value={stats.percent}
                                    max={100}
                                />
                                <span className="text-xs text-base-content/40">
                                    Ближайшая замена через{' '}
                                    <span
                                        className={
                                            stats.daysLeft < 7
                                                ? 'text-error font-semibold'
                                                : stats.daysLeft < 30
                                                  ? 'text-warning font-semibold'
                                                  : 'text-base-content/60'
                                        }
                                    >
                                        {stats.daysLeft} дн.
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
                            onDemount={() => setDemountingId(item.id)}
                            renderComponent={(c) => (
                                <ComponentRow key={c.id} component={c} realEstateId={id} />
                            )}
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
            </div>

            <AddEquipmentModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                realEstateId={id}
            />

            <ConfirmDialog
                isOpen={demountingId !== null}
                onClose={() => setDemountingId(null)}
                onConfirm={handleConfirmDemount}
                title="Демонтировать оборудование?"
                message="Оборудование будет перемещено в архив."
                confirmText="Демонтировать"
            />

            <ConfirmDialog
                isOpen={isDeletingAddress}
                onClose={() => setIsDeletingAddress(false)}
                onConfirm={handleConfirmDeleteAddress}
                title="Удалить адрес?"
                message="Объект будет удалён. Это действие нельзя отменить."
                confirmText="Удалить"
            />
        </PageContainer>
    );
}
