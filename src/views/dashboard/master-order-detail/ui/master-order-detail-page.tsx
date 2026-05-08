'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
    HomeIcon,
    MapPinIcon,
    PhoneIcon,
    UserIcon,
    ClockIcon,
    CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import {
    useGetOrderById,
    useUpdateOrderStatus,
    EOrderStatus,
    STATUS_LABEL,
    OrderPositionsList,
} from '@/entities/order';
import { useSingleOrderThumbnails } from '@/features/orders';
import { formatDateRu, formatUserInitials } from '@/shared/lib';
import { ConfirmDialog, DashboardBackHeader, PageContainer, QueryBoundary } from '@/shared/ui';

type TProps = {
    orderId: number;
};

type TStatusAction = {
    label: string;
    next: EOrderStatus;
    confirm: string;
};

const STATUS_ACTIONS: Partial<Record<EOrderStatus, TStatusAction>> = {
    [EOrderStatus.PENDING]: {
        label: 'Принять заказ',
        next: EOrderStatus.CONFIRMED,
        confirm: 'Принять заказ и подтвердить выезд?',
    },
    [EOrderStatus.CONFIRMED]: {
        label: 'Начать работу',
        next: EOrderStatus.IN_PROGRESS,
        confirm: 'Отметить заказ как «В работе»?',
    },
    [EOrderStatus.IN_PROGRESS]: {
        label: 'Завершить заказ',
        next: EOrderStatus.COMPLETED,
        confirm: 'Отметить заказ как выполненный?',
    },
};

export function MasterOrderDetailPage({ orderId }: TProps) {
    return (
        <QueryBoundary errorMessage="Ошибка загрузки заказа" resetKeys={[orderId]}>
            <MasterOrderDetailContent orderId={orderId} />
        </QueryBoundary>
    );
}

function MasterOrderDetailContent({ orderId }: TProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null);

    const { data: order } = useGetOrderById(orderId);
    const {
        mutate: updateStatus,
        isPending: isUpdating,
        isSuccess: isUpdateSuccess,
        reset: resetMutation,
    } = useUpdateOrderStatus();
    const { imageUrls, loadingIds } = useSingleOrderThumbnails(order);

    // Закрываем модалку сразу как только мутация завершилась успешно —
    // без useEffect, через производный стейт
    const isDialogOpen = confirmOpen && !isUpdateSuccess;

    const action = STATUS_ACTIONS[order.status] ?? null;
    const isFinished =
        order.status === EOrderStatus.COMPLETED || order.status === EOrderStatus.CANCELLED;

    const clientName = order.client
        ? `${order.client.first_name} ${order.client.last_name}`.trim()
        : null;

    const handleOpenDialog = () => {
        resetMutation();
        setConfirmError(null);
        setConfirmOpen(true);
    };

    const handleCloseDialog = () => {
        setConfirmOpen(false);
        setConfirmError(null);
    };

    const handleConfirm = () => {
        if (!action) return;
        updateStatus(
            { orderId, status: action.next },
            {
                onError: () => setConfirmError('Не удалось обновить статус. Попробуйте ещё раз.'),
            },
        );
    };

    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader title={`Заказ #${orderId}`} fallbackHref="/master/orders" />

            <div className="flex flex-col gap-3 max-w-lg mx-auto py-4">
                {/* Статус */}
                <div className="card bg-base-100 p-4 flex flex-row items-center justify-between gap-2">
                    <span className="text-sm font-medium">Статус</span>
                    <span
                        className={`text-sm font-semibold ${STATUS_LABEL[order.status].className}`}
                    >
                        {STATUS_LABEL[order.status].text}
                    </span>
                </div>

                {/* Клиент */}
                {order.client && (
                    <div className="card bg-base-100 p-4 flex flex-col gap-3">
                        <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                            Клиент
                        </p>
                        <div className="flex items-center gap-3">
                            {order.client.photo_url ? (
                                <Image
                                    src={order.client.photo_url}
                                    alt={clientName ?? ''}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover shrink-0"
                                />
                            ) : (
                                <div className="avatar avatar-placeholder shrink-0">
                                    <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                        <span className="text-sm font-semibold">
                                            {order.client ? (
                                                formatUserInitials(
                                                    order.client.first_name,
                                                    order.client.last_name,
                                                )
                                            ) : (
                                                <UserIcon className="size-5" />
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="font-medium text-sm leading-tight">
                                    {clientName}
                                </span>
                                {order.client.phone && (
                                    <a
                                        href={`tel:${order.client.phone}`}
                                        className="flex items-center gap-1 text-primary text-sm"
                                    >
                                        <PhoneIcon className="size-3.5" />
                                        {order.client.phone}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Адрес */}
                {order.realEstate?.address && (
                    <div className="card bg-base-100 p-4 flex flex-col gap-2">
                        <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                            Адрес
                        </p>
                        <div className="flex items-start gap-2">
                            <HomeIcon className="size-5 shrink-0 text-base-content/40 mt-0.5" />
                            <span className="text-sm">{order.realEstate.address}</span>
                        </div>
                        {order.realEstate.city && (
                            <div className="flex items-center gap-2">
                                <MapPinIcon className="size-5 shrink-0 text-base-content/40" />
                                <span className="text-sm text-base-content/60">
                                    {order.realEstate.city}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Дата выезда */}
                <div className="card bg-base-100 p-4 flex flex-col gap-2">
                    <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                        Расписание
                    </p>
                    <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="size-5 shrink-0 text-base-content/40" />
                        <span className="text-sm">
                            {order.scheduledDate?.date
                                ? formatDateRu(order.scheduledDate.date)
                                : 'Дата не назначена'}
                        </span>
                    </div>
                    {order.scheduledDate && (
                        <div className="flex items-center gap-2">
                            <ClockIcon className="size-5 shrink-0 text-base-content/40" />
                            <span className="text-sm text-base-content/60">
                                {order.scheduledDate.startHour}:
                                {String(order.scheduledDate.startMinute).padStart(2, '0')}
                                {' – '}
                                {order.scheduledDate.endHour}:
                                {String(order.scheduledDate.endMinute).padStart(2, '0')}
                            </span>
                        </div>
                    )}
                </div>

                {/* Состав заказа */}
                {Object.keys(order.cartState.items ?? {}).length > 0 && (
                    <div className="card bg-base-100 p-4 flex flex-col gap-3">
                        <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                            Состав заказа
                        </p>
                        <OrderPositionsList
                            cartState={order.cartState}
                            imageUrls={imageUrls}
                            loadingIds={loadingIds}
                        />
                    </div>
                )}

                {/* Нормо-часы */}
                {order.cartState.totalRateOfHours != null && (
                    <div className="card bg-base-100 p-4 flex flex-row items-center justify-between">
                        <span className="text-sm font-medium">Нормо-часы</span>
                        <span className="text-sm font-semibold">
                            {order.cartState.totalRateOfHours} ч
                        </span>
                    </div>
                )}

                {/* Кнопка действия */}
                {!isFinished && action && (
                    <button
                        type="button"
                        className="btn btn-primary w-full"
                        onClick={handleOpenDialog}
                        disabled={isUpdating}
                    >
                        {action.label}
                    </button>
                )}
            </div>

            {action && (
                <ConfirmDialog
                    isOpen={isDialogOpen}
                    onClose={handleCloseDialog}
                    onConfirm={handleConfirm}
                    title={action.label}
                    message={confirmError ?? action.confirm}
                    confirmText="Подтвердить"
                    cancelText="Отмена"
                    isBusy={isUpdating}
                />
            )}
        </PageContainer>
    );
}
