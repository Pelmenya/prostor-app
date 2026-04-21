'use client';

import type { TOrder } from '@/entities/order';
import { OrderCard } from '@/entities/order';
import { InfiniteList } from '@/shared/ui';

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
    return (
        <InfiniteList
            items={orders}
            hasMore={hasMore}
            isLoading={isFetchingNextPage}
            onLoadMore={onLoadMore}
            renderItem={(order) => (
                <OrderCard order={order} imageUrls={imageUrls} loadingIds={loadingIds} />
            )}
            keyExtractor={(order) => order.id}
            className="flex flex-col gap-4 lg:gap-6"
        />
    );
}
