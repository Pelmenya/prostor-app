'use client';

import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import type { TOrder } from '../../model/types/t-order';
import { OrderCard } from '../order-card/order-card';

type TOrderListProps = {
    orders: TOrder[];
    hasMore: boolean;
    isLoading: boolean;
    onLoadMore: () => void;
};

export function OrderList({ orders, hasMore, isLoading, onLoadMore }: TOrderListProps) {
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '100px',
    });

    useEffect(() => {
        if (inView && hasMore && !isLoading) {
            onLoadMore();
        }
    }, [inView, hasMore, isLoading, onLoadMore]);

    if (!orders?.length) {
        return (
            <div className="flex flex-col items-center gap-2">
                <span className="loading loading-spinner loading-md" />
                <span className="text-sm text-base-content/60">Загрузка...</span>
            </div>
        );
    }

    return (
        <div>
            <ul className="flex flex-col gap-4 lg:gap-6">
                {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                ))}
            </ul>

            {hasMore && (
                <div ref={ref} className="py-8 text-center min-h-[100px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-2">
                            <span className="loading loading-spinner loading-md" />
                            <span className="text-sm text-base-content/60">Загрузка...</span>
                        </div>
                    ) : (
                        <div className="h-4" />
                    )}
                </div>
            )}
        </div>
    );
}
