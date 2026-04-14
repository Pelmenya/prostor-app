'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircleIcon } from '@heroicons/react/24/solid';
import { useRealEstates, RealEstateCard } from '@/entities/real-estate';
import {
    useInstalledEquipmentForRealEstates,
    getCriticalStats,
} from '@/entities/installed-equipment';
import { PageContainer, PageTitle } from '@/shared/ui';

export function AddressesPage() {
    const router = useRouter();
    const { data: realEstates, isLoading, isError } = useRealEstates();
    const { equipmentByRealEstate } = useInstalledEquipmentForRealEstates(
        realEstates?.map((re) => re.id) ?? [],
    );

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
                            Добавить адрес
                        </Link>
                    </div>
                )}

                {realEstates && realEstates.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {realEstates.map((re) => {
                            const equipment = equipmentByRealEstate[re.id] ?? [];
                            const stats = getCriticalStats(equipment);
                            return (
                                <RealEstateCard
                                    key={re.id}
                                    realEstate={re}
                                    onClick={(id) => router.push(`/real-estate/${id}`)}
                                    criticalDaysLeft={stats?.daysLeft}
                                    criticalPercent={stats?.percent}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </PageContainer>
    );
}
