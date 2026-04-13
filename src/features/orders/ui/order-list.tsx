'use client';

import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import type { TOrder } from '@/entities/order';
import { OrderCard } from '@/entities/order';

type TOrderListProps = {
    orders: TOrder[];
    hasMore: boolean;
    isFetchingNextPage: boolean;
    onLoadMore: () => void;
    imageUrls?: Record<string, string | undefined>;
    loadingIds?: Set<string>;
};

export function OrderList({
    orders,
    hasMore,
    isFetchingNextPage,
    onLoadMore,
    imageUrls,
    loadingIds,
}: TOrderListProps) {
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '100px',
    });

    useEffect(() => {
        if (inView && hasMore && !isFetchingNextPage) {
            onLoadMore();
        }
    }, [inView, hasMore, isFetchingNextPage, onLoadMore]);

    return (
        <div>
            <ul className="flex flex-col gap-4 lg:gap-6">
                {orders.map((order) => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        imageUrls={imageUrls}
                        loadingIds={loadingIds}
                    />
                ))}
            </ul>

            {hasMore && (
                <div ref={ref} className="py-8 text-center min-h-[100px]">
                    {isFetchingNextPage ? (
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
