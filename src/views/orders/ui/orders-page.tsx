'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetOrders, useGetOrdersCount } from '@/entities/order';
import {
    OrderList,
    OrdersTabSwitcher,
    OrdersNotFound,
    TAB_STATUS_PRESETS,
} from '@/features/orders';
import type { TTabType } from '@/features/orders';
import { PageContainer, PageTitle } from '@/shared/ui';

export function OrdersPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TTabType>('actual');

    const statusFilter = TAB_STATUS_PRESETS[activeTab];

    // Список заказов
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

    // Счётчики для табов
    const { data: actualCountData, isLoading: isActualCountLoading } = useGetOrdersCount({
        status: [...TAB_STATUS_PRESETS.actual],
    });

    const { data: completedCountData, isLoading: isCompletedCountLoading } = useGetOrdersCount({
        status: [...TAB_STATUS_PRESETS.completed],
    });

    const orders = data?.pages.flatMap((page) => page.items) ?? [];
    const hasOrders = orders.length > 0;
    const isInitialLoading = isLoading && !hasOrders;

    const actualCount = actualCountData?.count ?? 0;
    const completedCount = completedCountData?.count ?? 0;
    const isCountsLoaded = !isActualCountLoading && !isCompletedCountLoading;
    const hasAnyOrders = isCountsLoaded && (actualCount > 0 || completedCount > 0);

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
        }
    };

    const handleTabChange = (tab: TTabType) => {
        setActiveTab(tab);
    };

    const handleGoToCatalog = () => {
        router.push('/catalog');
    };

    // Ошибка загрузки
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
        <PageContainer>
            <div className="flex flex-col gap-4 lg:gap-6">
                <PageTitle>Заказы</PageTitle>

                {hasAnyOrders && (
                    <OrdersTabSwitcher
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        actualCount={actualCountData?.count}
                        completedCount={completedCountData?.count}
                        isActualCountLoading={isActualCountLoading}
                        isCompletedCountLoading={isCompletedCountLoading}
                    />
                )}

                {isInitialLoading ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-20">
                        <div className="loading loading-spinner loading-lg" />
                        <div className="text-base-content/70">Загрузка заказов...</div>
                    </div>
                ) : hasOrders ? (
                    <OrderList
                        orders={orders}
                        hasMore={!!hasNextPage}
                        isLoading={isFetchingNextPage}
                        onLoadMore={handleLoadMore}
                    />
                ) : isCountsLoaded ? (
                    <OrdersNotFound
                        type="tab"
                        action={handleGoToCatalog}
                    />
                ) : null}
            </div>
        </PageContainer>
    );
}
