'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircleIcon } from '@heroicons/react/24/solid';
import { useRealEstates, RealEstateCard } from '@/entities/real-estate';
import {
    useInstalledEquipmentForRealEstates,
    getCriticalStats,
} from '@/entities/installed-equipment';
import { PageContainer, PageTitle, PageSpinner, QueryBoundary } from '@/shared/ui';
import { useAuth } from '@/shared/lib/platform';

export function AddressesPage() {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <PageSpinner />;
    return (
        <QueryBoundary errorMessage="Не удалось загрузить адреса">
            <AddressesContent />
        </QueryBoundary>
    );
}

function AddressesContent() {
    const router = useRouter();
    const { data: realEstates } = useRealEstates();
    const { equipmentByRealEstate } = useInstalledEquipmentForRealEstates(
        realEstates.map((re) => re.id),
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

                {realEstates.length === 0 && (
                    <div className="card bg-base-100 border border-base-300 p-8 text-center">
                        <p className="text-base-content/60 mb-4">У вас пока нет адресов</p>
                        <Link href="/real-estate/add" className="btn btn-primary btn-sm mx-auto">
                            Добавить адрес
                        </Link>
                    </div>
                )}

                {realEstates.length > 0 && (
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
