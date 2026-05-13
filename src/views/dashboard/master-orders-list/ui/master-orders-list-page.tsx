'use client';

import { useState, useTransition } from 'react';
import { useGetOrders, MasterOrderCard } from '@/entities/order';
import {
    OrderList,
    OrdersTabSwitcher,
    OrdersNotFound,
    TAB_STATUS_PRESETS,
    useOrderThumbnails,
} from '@/features/orders';
import type { TTabType } from '@/features/orders';
import { PageContainer, QueryBoundary, DashboardBackHeader } from '@/shared/ui';

export function MasterOrdersListPage() {
    return (
        <QueryBoundary errorMessage="Ошибка загрузки заказов">
            <MasterOrdersListContent />
        </QueryBoundary>
    );
}

function MasterOrdersListContent() {
    const [activeTab, setActiveTab] = useState<TTabType>('actual');
    const [isPending, startTransition] = useTransition();

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetOrders({
        limit: 20,
        status: [...TAB_STATUS_PRESETS[activeTab]],
    });

    const orders = data.pages.flatMap((page) => page.items);
    const { imageUrls, loadingIds } = useOrderThumbnails(orders);

    const handleTabChange = (tab: TTabType) => {
        startTransition(() => setActiveTab(tab));
    };

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
        }
    };

    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader title="Мои заказы" />
            <div
                className={`flex flex-col gap-4 max-w-lg mx-auto py-4 ${isPending ? 'opacity-60 transition-opacity' : ''}`}
            >
                <OrdersTabSwitcher
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    actualLabel="Активные"
                    completedLabel="Выполненные"
                />

                {orders.length === 0 ? (
                    <OrdersNotFound type="tab" href="/catalog" />
                ) : (
                    <OrderList
                        orders={orders}
                        hasMore={!!hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        onLoadMore={handleLoadMore}
                        renderItem={(order) => (
                            <MasterOrderCard
                                order={order}
                                imageUrls={imageUrls}
                                loadingIds={loadingIds}
                            />
                        )}
                    />
                )}
            </div>
        </PageContainer>
    );
}
