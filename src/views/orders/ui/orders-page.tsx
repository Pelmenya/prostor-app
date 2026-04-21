'use client';

import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useGetOrders, useGetOrdersCount } from '@/entities/order';
import { useOrderThumbnails, TAB_STATUS_PRESETS } from '@/features/orders';
import type { TTabType } from '@/features/orders';
import { PageSpinner, PageError } from '@/shared/ui';
import { OrdersPageContent } from './orders-page-content';

export function OrdersPage() {
    return (
        <ErrorBoundary
            fallbackRender={({ resetErrorBoundary }) => (
                <PageError message="Ошибка загрузки заказов" onRetry={resetErrorBoundary} />
            )}
        >
            <Suspense fallback={<PageSpinner />}>
                <OrdersContent />
            </Suspense>
        </ErrorBoundary>
    );
}

function OrdersContent() {
    const [activeTab, setActiveTab] = useState<TTabType>('actual');

    const statusFilter = TAB_STATUS_PRESETS[activeTab];

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

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
        }
    };

    return (
        <OrdersPageContent
            orders={orders}
            activeTab={activeTab}
            onTabChange={setActiveTab}
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
    );
}
