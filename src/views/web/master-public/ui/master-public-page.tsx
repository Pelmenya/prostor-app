'use client';

import Link from 'next/link';
import Image from 'next/image';
import { StarIcon } from '@heroicons/react/20/solid';
import { EUserRole } from '@/shared/model';
import { useGetExecutorAverageRating } from '@/entities/order-feedback';
import { useGetMasterById } from '@/features/master-public';
import { QualificationCard, LocationCard, VehicleCard } from '@/widgets/master-profile';
import { PageContainer, PageTitle, PageSpinner, QueryBoundary } from '@/shared/ui';
import { useAuth } from '@/shared/lib/platform';

type TMasterPublicPageProps = {
    masterId: number;
};

export function MasterPublicPage({ masterId }: TMasterPublicPageProps) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <PageSpinner />;
    return (
        <QueryBoundary errorMessage="Не удалось загрузить профиль мастера">
            <MasterPublicContent masterId={masterId} />
        </QueryBoundary>
    );
}

function MasterPublicContent({ masterId }: TMasterPublicPageProps) {
    const { data: master } = useGetMasterById(masterId);
    const { data: ratingData } = useGetExecutorAverageRating(masterId);

    const accountService = master.accountService;
    const isActive = master.role === EUserRole.SERVICE;
    const avgRating = master.avgRating ?? ratingData?.average;

    return (
        <PageContainer>
            <PageTitle className="mb-4">Страница мастера</PageTitle>

            <div className="flex flex-col gap-4 pb-4 max-w-lg mx-auto w-full">
                <div className="flex items-center gap-4 p-4 bg-base-100 border border-base-300 rounded-2xl">
                    <div className="avatar shrink-0">
                        <div className="size-16 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100">
                            {master.photo_url ? (
                                <Image
                                    src={master.photo_url}
                                    alt={master.first_name}
                                    width={64}
                                    height={64}
                                    className="rounded-full object-cover"
                                />
                            ) : (
                                <div className="bg-primary/10 size-16 rounded-full flex items-center justify-center text-xl font-semibold">
                                    {master.first_name[0]}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <p className="font-semibold leading-[110%] truncate">
                            {master.first_name} {master.last_name}
                        </p>
                        {master.username && (
                            <p className="text-sm text-base-content/50">@{master.username}</p>
                        )}
                        {avgRating ? (
                            <Link
                                href={`/master/${masterId}/rating`}
                                className="flex items-center gap-1 mt-0.5 w-fit"
                            >
                                <StarIcon className="size-4 text-warning" />
                                <span className="font-semibold text-sm text-warning">
                                    {avgRating.toLocaleString('ru-RU', {
                                        minimumFractionDigits: 1,
                                        maximumFractionDigits: 1,
                                    })}
                                </span>
                                <span className="text-xs text-base-content/50">· отзывы</span>
                            </Link>
                        ) : (
                            <p className="text-xs text-base-content/40 mt-0.5">Нет оценок</p>
                        )}
                    </div>
                </div>

                {!isActive && (
                    <div className="alert alert-warning text-sm py-2 px-4 rounded-2xl">
                        Мастер больше не работает
                    </div>
                )}

                {accountService?.grade && (
                    <QualificationCard grade={accountService.grade} readOnly outlined />
                )}
                {accountService?.address && (
                    <LocationCard
                        address={accountService.address}
                        departureBasis={accountService.departureBasis}
                        readOnly
                        outlined
                    />
                )}
                {(accountService?.carModel || accountService?.carNumber) && (
                    <VehicleCard
                        carModel={accountService.carModel}
                        carNumber={accountService.carNumber}
                        maxCargoLength={accountService.maxCargoLength}
                        maxCargoWidth={accountService.maxCargoWidth}
                        maxCargoHeight={accountService.maxCargoHeight}
                        maxCargoWeight={accountService.maxCargoWeight}
                        readOnly
                        outlined
                    />
                )}
            </div>
        </PageContainer>
    );
}
