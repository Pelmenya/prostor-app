'use client';

import Link from 'next/link';
import { MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAccountService } from '@/entities/account-service';
import { RouteMap, useGetWorkDayRoute, useGetOrdersByDate } from '@/features/master-work-days';
import { PageContainer, PageSpinner, QueryBoundary, DashboardBackHeader } from '@/shared/ui';
import { useAuth } from '@/shared/lib/platform';
import { formatDateRu, formatDuration } from '@/shared/lib';

type TProps = { date: string };

export function MasterWorkDayPage({ date }: TProps) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <PageSpinner />;
    return (
        <QueryBoundary errorMessage="Ошибка загрузки рабочего дня">
            <MasterWorkDayContent date={date} />
        </QueryBoundary>
    );
}

function MasterWorkDayContent({ date }: TProps) {
    const { data: accountService } = useAccountService();
    const { data: routeData } = useGetWorkDayRoute(date);
    const { data: orders } = useGetOrdersByDate(date);

    const route = routeData?.route?.routes?.[0] ?? null;
    const sortOrders = routeData?.sortOrders ?? orders;

    const homeCoords = accountService?.coordinates?.coordinates as [number, number] | undefined;

    const stops = sortOrders
        .map((order, i) => {
            const coords = order.realEstate?.coordinates?.coordinates as
                | [number, number]
                | undefined;
            if (!coords) return null;
            return {
                id: order.id ?? i,
                address: order.realEstate?.address ?? '',
                coordinates: coords,
            };
        })
        .filter(
            (s): s is { id: number; address: string; coordinates: [number, number] } => s !== null,
        );

    const totalHours = sortOrders.reduce((acc, o) => acc + (o.cartState.totalRateOfHours ?? 0), 0);

    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader title={formatDateRu(date)} />

            <div className="flex flex-col gap-4 max-w-lg mx-auto py-4">
                {/* Статистика */}
                {route && (
                    <div className="grid grid-cols-3 gap-2">
                        <div className="card bg-base-100 p-3 flex flex-col gap-1">
                            <p className="text-xs text-base-content/50">Нормо-часы</p>
                            <p className="font-semibold text-sm">{totalHours} ч</p>
                        </div>
                        <div className="card bg-base-100 p-3 flex flex-col gap-1">
                            <p className="text-xs text-base-content/50">Расстояние</p>
                            <p className="font-semibold text-sm">
                                {(route.distance / 1000).toFixed(1)} км
                            </p>
                        </div>
                        <div className="card bg-base-100 p-3 flex flex-col gap-1">
                            <p className="text-xs text-base-content/50">В пути</p>
                            <p className="font-semibold text-sm">
                                {formatDuration(route.duration)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Карта маршрута */}
                {route && stops.length > 0 && (
                    <RouteMap route={route} stops={stops} homeCoordinates={homeCoords} />
                )}

                {/* Список заказов */}
                {sortOrders.length === 0 ? (
                    <div className="card bg-base-100 p-4 text-sm text-base-content/50 text-center">
                        Заказов на этот день нет
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {accountService?.address && (
                            <div className="flex items-center gap-2 px-1">
                                <div className="size-3 rounded-full bg-primary shrink-0" />
                                <p className="text-sm text-base-content/60">
                                    {accountService.address}
                                </p>
                            </div>
                        )}

                        {sortOrders.map((order, i) => {
                            const leg = route?.legs[i];
                            return (
                                <div key={order.id} className="flex flex-col gap-1">
                                    {leg && (
                                        <div className="flex items-center gap-1 px-1 text-xs text-base-content/40">
                                            <ClockIcon className="size-3" />
                                            <span>{formatDuration(leg.duration)}</span>
                                            <span>·</span>
                                            <span>{(leg.distance / 1000).toFixed(1)} км</span>
                                        </div>
                                    )}
                                    <Link href={`/dashboard/master/orders/${order.id}`}>
                                        <div className="card bg-base-100 p-4 flex flex-row items-start gap-3 hover:bg-base-200 transition-colors">
                                            <div className="flex items-center justify-center size-7 rounded-full bg-error/10 text-error text-xs font-bold shrink-0 mt-0.5">
                                                {i + 1}
                                            </div>
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <div className="flex items-center gap-1">
                                                    <MapPinIcon className="size-3.5 shrink-0 text-base-content/40" />
                                                    <p className="text-sm font-medium truncate">
                                                        {order.realEstate?.address ?? '—'}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-base-content/50">
                                                    Заказ #{order.id}
                                                    {order.cartState.totalRateOfHours
                                                        ? ` · ${order.cartState.totalRateOfHours} н/ч`
                                                        : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}

                        {accountService?.address && (
                            <div className="flex items-center gap-2 px-1">
                                <div className="size-3 rounded-full bg-primary shrink-0" />
                                <p className="text-sm text-base-content/60">
                                    {accountService.address}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PageContainer>
    );
}
