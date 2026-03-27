'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircleIcon } from '@heroicons/react/24/solid';
import { useRealEstates, useDeleteRealEstate, RealEstateCard } from '@/entities/real-estate';
import { PageContainer, PageTitle } from '@/shared/ui';

export function AddressesPage() {
    const { data: realEstates, isLoading } = useRealEstates();
    const deleteRealEstate = useDeleteRealEstate();
    const [confirmId, setConfirmId] = useState<number | null>(null);

    const handleDelete = (id: number) => {
        setConfirmId(id);
    };

    const handleConfirmDelete = () => {
        if (confirmId === null) return;
        deleteRealEstate.mutate(confirmId);
        setConfirmId(null);
    };

    return (
        <PageContainer>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <PageTitle>Мои адреса</PageTitle>
                    <Link href="/profile/addresses/add" className="btn btn-sm btn-primary">
                        <PlusCircleIcon className="size-4" />
                        <span className="text-sm font-semibold">Добавить</span>
                    </Link>
                </div>

                {isLoading && (
                    <div className="flex flex-col gap-3">
                        <div className="skeleton h-24 w-full rounded-2xl" />
                        <div className="skeleton h-24 w-full rounded-2xl" />
                    </div>
                )}

                {!isLoading && (!realEstates || realEstates.length === 0) && (
                    <div className="card bg-base-100 border border-base-300 p-8 text-center">
                        <p className="text-base-content/60 mb-4">У вас пока нет адресов</p>
                        <Link
                            href="/profile/addresses/add"
                            className="btn btn-primary btn-sm mx-auto"
                        >
                            Добавить первый адрес
                        </Link>
                    </div>
                )}

                {realEstates && realEstates.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {realEstates.map((re) => (
                            <RealEstateCard key={re.id} realEstate={re} onDelete={handleDelete} />
                        ))}
                    </div>
                )}
            </div>

            {/* Диалог подтверждения удаления */}
            {confirmId !== null && (
                <dialog className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">Удалить адрес?</h3>
                        <p className="py-4 text-sm text-base-content/70">
                            Объект будет удалён. Это действие нельзя отменить.
                        </p>
                        <div className="modal-action">
                            <button className="btn btn-sm" onClick={() => setConfirmId(null)}>
                                Отмена
                            </button>
                            <button className="btn btn-sm btn-error" onClick={handleConfirmDelete}>
                                Удалить
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setConfirmId(null)} />
                </dialog>
            )}
        </PageContainer>
    );
}
