'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import {
    useGetOrderById,
    useUpdateOrderStatus,
    EOrderStatus,
    STATUS_LABEL,
    OrderPositionsList,
    getMasterTransition,
} from '@/entities/order';
import { useCurrentUserSuspense } from '@/entities/user';
import { useSingleOrderThumbnails } from '@/features/orders';
import { QueryBoundary, PageContainer, DashboardBackHeader } from '@/shared/ui';
import { MASTER_ORDERS_PATH } from '@/shared/config';
import { ClientCard } from './client-card';
import { AddressCard } from './address-card';
import { ScheduleCard } from './schedule-card';
import { MasterOrderActions } from './master-order-actions';

type TProps = {
    orderId: number;
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

    const { data: user } = useCurrentUserSuspense();
    const { data: order } = useGetOrderById(orderId);

    // PII-гард: заказ с исполнителем не должен открываться чужим мастером
    if (order.executor && order.executor.id !== user.id) {
        notFound();
    }

    const {
        mutate: updateStatus,
        isPending: isUpdating,
        reset: resetMutation,
    } = useUpdateOrderStatus();
    const { imageUrls, loadingIds } = useSingleOrderThumbnails(order);

    const action = getMasterTransition(order.status);
    const isFinished =
        order.status === EOrderStatus.COMPLETED || order.status === EOrderStatus.CANCELLED;

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
        if (!action || isUpdating) return;
        updateStatus(
            { orderId, status: action.next },
            {
                onSuccess: () => setConfirmOpen(false),
                onError: () => setConfirmError('Не удалось обновить статус. Попробуйте ещё раз.'),
            },
        );
    };

    const hasItems = Object.keys(order.cartState.items ?? {}).length > 0;

    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader title={`Заказ #${orderId}`} fallbackHref={MASTER_ORDERS_PATH} />

            <div className="flex flex-col gap-3 max-w-lg mx-auto py-4">
                {/* Статус */}
                <div className="card bg-base-100 p-4 flex flex-row items-center justify-between gap-2">
                    <span className="text-sm font-medium">Статус</span>
                    <span
                        className={`text-sm font-semibold ${STATUS_LABEL[order.status]?.className ?? ''}`}
                    >
                        {STATUS_LABEL[order.status]?.text ?? order.status}
                    </span>
                </div>

                {order.client && <ClientCard client={order.client} />}

                {order.realEstate?.address && <AddressCard realEstate={order.realEstate} />}

                <ScheduleCard scheduledDate={order.scheduledDate} />

                {/* Состав заказа */}
                {hasItems && (
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

                {!isFinished && action && (
                    <MasterOrderActions
                        action={action}
                        isOpen={confirmOpen}
                        isBusy={isUpdating}
                        error={confirmError}
                        onOpen={handleOpenDialog}
                        onClose={handleCloseDialog}
                        onConfirm={handleConfirm}
                    />
                )}
            </div>
        </PageContainer>
    );
}
