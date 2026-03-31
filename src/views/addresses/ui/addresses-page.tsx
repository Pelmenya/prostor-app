'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircleIcon } from '@heroicons/react/24/solid';
import { useRealEstates, useDeleteRealEstate, RealEstateCard } from '@/entities/real-estate';
import { PageContainer, PageTitle, ConfirmDialog } from '@/shared/ui';

export function AddressesPage() {
    const router = useRouter();
    const { data: realEstates, isLoading, isError } = useRealEstates();
    const deleteRealEstate = useDeleteRealEstate();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleConfirmDelete = async () => {
        if (deletingId === null) return;
        try {
            await deleteRealEstate.mutateAsync(deletingId);
        } catch {
            // TODO: уведомление об ошибке (когда определимся с решением)
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <PageContainer>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <PageTitle>Мои адреса</PageTitle>
                    <Link href="/real-estate/add" className="btn btn-sm btn-primary">
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

                {isError && (
                    <div className="alert alert-error text-sm">Не удалось загрузить адреса</div>
                )}

                {!isLoading && !isError && (!realEstates || realEstates.length === 0) && (
                    <div className="card bg-base-100 border border-base-300 p-8 text-center">
                        <p className="text-base-content/60 mb-4">У вас пока нет адресов</p>
                        <Link href="/real-estate/add" className="btn btn-primary btn-sm mx-auto">
                            Добавить первый адрес
                        </Link>
                    </div>
                )}

                {realEstates && realEstates.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {realEstates.map((re) => (
                            <RealEstateCard
                                key={re.id}
                                realEstate={re}
                                onClick={(id) => router.push(`/real-estate/${id}`)}
                                onDelete={setDeletingId}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={deletingId !== null}
                onClose={() => setDeletingId(null)}
                onConfirm={handleConfirmDelete}
                title="Удалить адрес?"
                message="Объект будет удалён. Это действие нельзя отменить."
            />
        </PageContainer>
    );
}
