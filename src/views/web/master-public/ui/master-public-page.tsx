'use client';

import Link from 'next/link';
import Image from 'next/image';
import { StarIcon } from '@heroicons/react/20/solid';
import { EUserRole } from '@/shared/model';
import { useGetExecutorAverageRating } from '@/entities/order-feedback';
import { useGetMasterById } from '@/features/master-public';
import { QualificationCard, LocationCard, VehicleCard } from '@/widgets/master-profile';
import { QueryBoundary } from '@/shared/ui';

type TMasterPublicPageProps = {
    masterId: number;
};

export function MasterPublicPage({ masterId }: TMasterPublicPageProps) {
    return (
        <QueryBoundary errorMessage="Не удалось загрузить профиль мастера">
            <MasterPublicContent masterId={masterId} />
        </QueryBoundary>
    );
}

function MasterPublicContent({ masterId }: { masterId: number }) {
    const { data: master } = useGetMasterById(masterId);
    const { data: ratingData } = useGetExecutorAverageRating(masterId);

    const accountService = master.accountService;
    const isActive = master.role === EUserRole.SERVICE;

    return (
        <div className="flex flex-col">
            <div className="bg-base-100 p-4 flex flex-col items-center gap-3 text-center border-b border-base-200">
                <div className="avatar">
                    <div className="size-20 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100">
                        {master.photo_url ? (
                            <Image
                                src={master.photo_url}
                                alt={master.first_name}
                                width={80}
                                height={80}
                                className="rounded-full object-cover"
                            />
                        ) : (
                            <div className="bg-primary/10 size-20 rounded-full flex items-center justify-center text-2xl font-semibold">
                                {master.first_name[0]}
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h1 className="text-xl font-bold">
                        {master.first_name} {master.last_name}
                    </h1>
                    {master.username && (
                        <p className="text-sm text-base-content/50">@{master.username}</p>
                    )}
                </div>

                {!isActive && (
                    <div className="alert alert-warning text-sm py-2 px-3">
                        Мастер больше не работает в нашей компании
                    </div>
                )}

                {master.avgRating ? (
                    <Link
                        href={`/master/${masterId}/rating`}
                        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                    >
                        <StarIcon className="size-5 text-warning" />
                        <span className="font-semibold text-warning">
                            {master.avgRating.toLocaleString('ru-RU', {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                            })}
                        </span>
                        <span className="text-sm text-base-content/50">· смотреть отзывы</span>
                    </Link>
                ) : ratingData?.average ? (
                    <Link
                        href={`/master/${masterId}/rating`}
                        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                    >
                        <StarIcon className="size-5 text-warning" />
                        <span className="font-semibold text-warning">
                            {ratingData.average.toLocaleString('ru-RU', {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                            })}
                        </span>
                        <span className="text-sm text-base-content/50">· смотреть отзывы</span>
                    </Link>
                ) : (
                    <p className="text-sm text-base-content/40">Нет оценок</p>
                )}
            </div>

            <div className="flex flex-col gap-3 p-4">
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
        </div>
    );
}
