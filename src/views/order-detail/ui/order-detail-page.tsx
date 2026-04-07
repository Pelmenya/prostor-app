'use client';

import { useState } from 'react';
import {
    useGetOrderById,
    useUpdateOrderStatus,
    EOrderStatus,
    OrderReadonlyItems,
} from '@/entities/order';
import { useProductThumbnails } from '@/entities/product';
import { formatPrice } from '@/shared/lib';
import { ConfirmDialog, PageContainer, PageTitle } from '@/shared/ui';
import { HomeIcon, MapPinIcon } from '@heroicons/react/24/solid';
import { OrderCompactItems } from './order-compact-items';
import { OrderStatusBlock } from './order-status-block';
import { OrderActions } from './order-actions';

type TOrderDetailPageProps = {
    orderId: number;
};

export function OrderDetailPage({ orderId }: TOrderDetailPageProps) {
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const { mutate: updateStatus, isPending: isCancelling } = useUpdateOrderStatus();

    const { data: order, isLoading, error } = useGetOrderById(orderId);

    const productIds = Object.keys(order?.cartState?.items ?? {});
    const { imageUrls, loadingIds } = useProductThumbnails(productIds);

    if (isLoading) return <p>Загрузка...</p>;
    if (error || !order) return <p>Ошибка загрузки заказа</p>;

    const items = Object.values(order.cartState.items ?? {});
    const isCancelled = order.status === EOrderStatus.CANCELLED;
    const isCompact = isCancelled || order.status === EOrderStatus.COMPLETED;

    return (
        <PageContainer>
            <PageTitle>Детали заказа №{order.id}</PageTitle>
            <div className="flex flex-col gap-4 pb-4 max-w-lg mx-auto w-full">
                {/* Состав заказа — полный вид */}
                {!isCompact && (
                    <OrderReadonlyItems
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

                {/* Доставка */}
                {!isCancelled && (
                    <div className="relative flex justify-between gap-4 p-4 bg-base-100 border border-base-300 rounded-2xl w-full">
                        <span className="font-medium text-sm leading-[110%]">Доставка</span>
                        {order.deliveryCost && order.deliveryCost > 0 ? (
                            <span className="text-primary font-semibold text-sm leading-[110%]">
                                {formatPrice(order.deliveryCost)}
                            </span>
                        ) : (
                            <span className="text-sm leading-[110%]">Уточняется</span>
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
                                    <span className="font-semibold text-sm leading-[110%]">
                                        Адрес самовывоза
                                    </span>
                                    <span className="text-sm leading-[110%]">
                                        {order.pickupStore.address}
                                        {order.pickupStore.phone && (
                                            <p>Тел: {order.pickupStore.phone}</p>
                                        )}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Адрес установки */}
                        <div className="relative flex items-center gap-2 p-4 bg-base-100 border border-base-300 rounded-2xl w-full">
                            <HomeIcon className="size-6" />
                            <div className="flex flex-col gap-1">
                                <span className="font-semibold text-sm leading-[110%]">Адрес</span>
                                <span className="text-sm leading-[110%]">
                                    {order.realEstate.address}
                                </span>
                            </div>
                        </div>

                        {/* Исполнитель */}
                        {order.executor && (
                            <div className="relative flex items-center gap-2 p-4 bg-base-100 border border-base-300 rounded-2xl w-full">
                                <span>{order.executor.first_name}</span>
                                <span>{order.executor.last_name}</span>
                            </div>
                        )}
                    </>
                )}

                {/* Кнопки */}
                <OrderActions
                    status={order.status}
                    executor={order.executor}
                    isCancelled={isCancelled}
                    isCancelling={isCancelling}
                    onCancelClick={() => setIsCancelOpen(true)}
                />
            </div>

            <ConfirmDialog
                isOpen={isCancelOpen}
                onClose={() => setIsCancelOpen(false)}
                onConfirm={() =>
                    updateStatus(
                        { orderId, status: EOrderStatus.CANCELLED },
                        { onSuccess: () => setIsCancelOpen(false) },
                    )
                }
                title="Отменить заказ?"
                message={`Заказ №${orderId} будет отменен. Это действие необратимо`}
                confirmText={isCancelling ? 'Подождите...' : 'Да, отменить'}
                cancelText="Назад"
            />
        </PageContainer>
    );
}
