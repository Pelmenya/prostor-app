'use client';

import { useState, useTransition } from 'react';
import { useGetOrders, useGetOrdersCount } from '@/entities/order';
import { useOrderThumbnails, TAB_STATUS_PRESETS } from '@/features/orders';
import type { TTabType } from '@/features/orders';
import { PageSpinner, QueryBoundary } from '@/shared/ui';
import { useAuth } from '@/shared/lib/platform';
import { cn } from '@/shared/lib';
import { OrdersPageContent } from './orders-page-content';

export function OrdersPage() {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <PageSpinner />;
    return (
        <QueryBoundary errorMessage="Ошибка загрузки заказов">
            <OrdersContent />
        </QueryBoundary>
    );
}

function OrdersContent() {
    const [activeTab, setActiveTab] = useState<TTabType>('actual');
    const [isPending, startTransition] = useTransition();

    const statusFilter = TAB_STATUS_PRESETS[activeTab];

    // useSuspenseInfiniteQuery suspend'ит только первую страницу.
    // fetchNextPage() использует isFetchingNextPage — локальный индикатор внутри OrderList.
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetOrders({
        limit: 10,
        status: [...statusFilter],
    });

    const { data: actualCountData, isLoading: isActualCountLoading } = useGetOrdersCount({
        status: [...TAB_STATUS_PRESETS.actual],
    });

    const { data: completedCountData, isLoading: isCompletedCountLoading } = useGetOrdersCount({
        status: [...TAB_STATUS_PRESETS.completed],
    });

    const orders = data.pages.flatMap((page) => page.items);
    const hasOrders = orders.length > 0;

    const { imageUrls, loadingIds } = useOrderThumbnails(orders);

    const actualCount = actualCountData?.count ?? 0;
    const completedCount = completedCountData?.count ?? 0;
    const isCountsLoaded = !isActualCountLoading && !isCompletedCountLoading;
    const hasAnyOrders = isCountsLoaded && (actualCount > 0 || completedCount > 0);

    const handleTabChange = (tab: TTabType) => {
        startTransition(() => setActiveTab(tab));
    };

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
        }
    };

    return (
        <div className={cn('grow flex flex-col', isPending && 'opacity-60 transition-opacity')}>
            <OrdersPageContent
                orders={orders}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                hasOrders={hasOrders}
                hasAnyOrders={hasAnyOrders}
                isCountsLoaded={isCountsLoaded}
                hasMore={!!hasNextPage}
                isLoadingMore={isFetchingNextPage}
                onLoadMore={handleLoadMore}
                actualCount={actualCountData?.count}
                completedCount={completedCountData?.count}
                isActualCountLoading={isActualCountLoading}
                isCompletedCountLoading={isCompletedCountLoading}
                imageUrls={imageUrls}
                loadingIds={loadingIds}
            />
        </div>
    );
}
