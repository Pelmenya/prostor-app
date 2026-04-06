'use client';

import { useState } from 'react';
import { useGetOrders, useGetOrdersCount } from '@/entities/order';
import { useOrderThumbnails, TAB_STATUS_PRESETS } from '@/features/orders';
import type { TTabType } from '@/features/orders';
import { PageContainer } from '@/shared/ui';
import { OrdersPageContent } from './orders-page-content';

export function OrdersPage() {
    const [activeTab, setActiveTab] = useState<TTabType>('actual');

    const statusFilter = TAB_STATUS_PRESETS[activeTab];

    // TODO: добавить enabled: !!session?.user после реализации NextAuth
    // чтобы не стрелять запросами до авторизации (сейчас защита через middleware)
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
        refetch,
    } = useGetOrders({
        limit: 10,
        status: [...statusFilter],
    });

    // TODO: добавить enabled: !!session?.user после реализации NextAuth
    const { data: actualCountData, isLoading: isActualCountLoading } = useGetOrdersCount({
        status: [...TAB_STATUS_PRESETS.actual],
    });

    // TODO: добавить enabled: !!session?.user после реализации NextAuth
    const { data: completedCountData, isLoading: isCompletedCountLoading } = useGetOrdersCount({
        status: [...TAB_STATUS_PRESETS.completed],
    });

    const orders = data?.pages.flatMap((page) => page.items) ?? [];
    const hasOrders = orders.length > 0;
    const isInitialLoading = isLoading && !hasOrders;

    // Дедупликация productIds при бесконечной прокрутке
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

    if (error) {
        return (
            <PageContainer>
                <div className="flex flex-col gap-4 items-center justify-center py-20">
                    <div className="text-error text-lg">Ошибка загрузки заказов</div>
                    <button onClick={() => refetch()} className="btn btn-primary">
                        Попробовать снова
                    </button>
                </div>
            </PageContainer>
        );
    }

    return (
        <OrdersPageContent
            orders={orders}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            hasOrders={hasOrders}
            isInitialLoading={isInitialLoading}
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
