'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    useGetOrders,
    useGetOrdersCount,
    OrderList,
    OrdersTabSwitcher,
    OrdersNotFound,
    TAB_STATUS_PRESETS,
} from '@/entities/order';
import type { TTabType } from '@/entities/order';
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

                <OrdersTabSwitcher
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    actualCount={actualCountData?.count}
                    completedCount={completedCountData?.count}
                    isActualCountLoading={isActualCountLoading}
                    isCompletedCountLoading={isCompletedCountLoading}
                />

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
                ) : (
                    <OrdersNotFound
                        type="tab"
                        action={handleGoToCatalog}
                    />
                )}
            </div>
        </PageContainer>
    );
}
