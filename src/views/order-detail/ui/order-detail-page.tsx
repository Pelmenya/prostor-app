'use client';

import { useState } from 'react';
import { useGetOrderById, useUpdateOrderStatus, EOrderStatus } from '@/entities/order';
import { CartReadonlyView } from '@/features/cart';
import { useSingleOrderThumbnails } from '@/features/orders';
import Image from 'next/image';
import { formatPrice, formatUserInitials } from '@/shared/lib';
import { ConfirmDialog, PageContainer, PageTitle, PageSpinner, QueryBoundary } from '@/shared/ui';
import { useAuth } from '@/shared/lib/platform';
import { HomeIcon, MapPinIcon } from '@heroicons/react/24/solid';
import { OrderCompactItems } from './order-compact-items';
import { OrderStatusBlock } from './order-status-block';
import { OrderActions } from './order-actions';

type TOrderDetailPageProps = {
    orderId: number;
};

export function OrderDetailPage({ orderId }: TOrderDetailPageProps) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <PageSpinner />;
    return (
        <QueryBoundary errorMessage="Ошибка загрузки заказа" resetKeys={[orderId]}>
            <OrderDetailContent orderId={orderId} />
        </QueryBoundary>
    );
}

function OrderDetailContent({ orderId }: TOrderDetailPageProps) {
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const { mutate: updateStatus, isPending: isCancelling } = useUpdateOrderStatus();

    const { data: order } = useGetOrderById(orderId);
    const { imageUrls, loadingIds } = useSingleOrderThumbnails(order);

    const items = Object.values(order.cartState.items ?? {});
    const isCancelled = order.status === EOrderStatus.CANCELLED;
    const isCompact = isCancelled || order.status === EOrderStatus.COMPLETED;

    return (
        <PageContainer>
            <PageTitle className="mb-4">Детали заказа №{order.id}</PageTitle>
            <div className="flex flex-col gap-4 pb-4 max-w-lg mx-auto w-full">
                {/* Состав заказа — полный вид */}
                {!isCompact && (
                    <CartReadonlyView
                        items={order.cartState.items ?? {}}
                        imageUrls={imageUrls}
                        loadingIds={loadingIds}
                    />
                )}

                {/* Состав заказа — компактный вид с модалкой */}
                {isCompact && (
                    <OrderCompactItems
                        items={items}
                        imageUrls={imageUrls}
                        loadingIds={loadingIds}
                    />
                )}

                {/* Итого */}
                {order.totalAmount != null && (
                    <div className="relative flex justify-between gap-4 p-4 bg-base-100 border border-base-300 rounded-2xl w-full">
                        <span className="font-medium text-sm leading-110">Итого</span>
                        <span className="text-primary font-semibold text-sm leading-110">
                            {formatPrice(order.totalAmount)}
                        </span>
                    </div>
                )}

                {/* Доставка */}
                {!isCancelled && (
                    <div className="relative flex justify-between gap-4 p-4 bg-base-100 border border-base-300 rounded-2xl w-full">
                        <span className="font-medium text-sm leading-110">Доставка</span>
                        {order.deliveryCost != null && order.deliveryCost > 0 ? (
                            <span className="text-primary font-semibold text-sm leading-110">
                                {formatPrice(order.deliveryCost)}
                            </span>
                        ) : order.deliveryCost === 0 ? (
                            <span className="text-primary font-semibold text-sm leading-110">
                                Бесплатно
                            </span>
                        ) : (
                            <span className="text-sm leading-110">Уточняется</span>
                        )}
                    </div>
                )}

                {/* Статус */}
                <OrderStatusBlock
                    status={order.status}
                    scheduledDate={order.scheduledDate}
                    createdAt={order.createdAt}
                    updatedAt={order.updatedAt}
                    isCompact={isCompact}
                />

                {!isCancelled && (
                    <>
                        {/* Адрес самовывоза */}
                        {order.pickupStore && order.status !== EOrderStatus.COMPLETED && (
                            <div className="relative flex items-center gap-2 p-4 bg-base-100 border border-base-300 rounded-2xl w-full">
                                <MapPinIcon className="size-6" />
                                <div className="flex flex-col gap-1">
                                    <span className="font-semibold text-sm leading-110">
                                        Адрес самовывоза
                                    </span>
                                    <span className="text-sm leading-110">
                                        {order.pickupStore.address}
                                        {order.pickupStore.phone && (
                                            <span className="block">
                                                Тел: {order.pickupStore.phone}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Адрес установки */}
                        <div className="relative flex items-center gap-2 p-4 bg-base-100 border border-base-300 rounded-2xl w-full">
                            <HomeIcon className="size-6" />
                            <div className="flex flex-col gap-1">
                                <span className="font-semibold text-sm leading-110">Адрес</span>
                                <span className="text-sm leading-110">
                                    {order.realEstate?.address}
                                </span>
                            </div>
                        </div>

                        {/* Исполнитель */}
                        {order.executor && (
                            <div className="relative flex items-center gap-3 p-4 bg-base-100 border border-base-300 rounded-2xl w-full">
                                {order.executor.photo_url ? (
                                    <Image
                                        src={order.executor.photo_url}
                                        alt={`${order.executor.first_name} ${order.executor.last_name}`}
                                        width={40}
                                        height={40}
                                        className="rounded-full object-cover shrink-0"
                                    />
                                ) : (
                                    <div className="avatar avatar-placeholder shrink-0">
                                        <div className="size-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                                            <span className="text-sm font-semibold">
                                                {formatUserInitials(
                                                    order.executor.first_name,
                                                    order.executor.last_name,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs leading-tight">Исполнитель</span>
                                    <span className="font-medium text-sm leading-tight">
                                        {order.executor.first_name} {order.executor.last_name}
                                    </span>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Кнопки */}
                <OrderActions
                    orderId={orderId}
                    status={order.status}
                    executor={order.executor}
                    isCancelled={isCancelled}
                    isCancelling={isCancelling}
                    onCancelClick={() => setIsCancelOpen(true)}
                />
            </div>

            <ConfirmDialog
                isOpen={isCancelOpen}
                onClose={() => {
                    setIsCancelOpen(false);
                    setCancelError(null);
                }}
                onConfirm={() =>
                    updateStatus(
                        { orderId, status: EOrderStatus.CANCELLED },
                        {
                            onSuccess: () => {
                                setIsCancelOpen(false);
                                setCancelError(null);
                            },
                            onError: () =>
                                setCancelError('Не удалось отменить заказ. Попробуйте ещё раз.'),
                        },
                    )
                }
                title="Отменить заказ?"
                message={cancelError ?? `Заказ №${orderId} будет отменен. Это действие необратимо`}
                confirmText="Да, отменить"
                cancelText="Назад"
                isBusy={isCancelling}
            />
        </PageContainer>
    );
}
