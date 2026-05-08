'use client';

import { useState, useTransition } from 'react';
import { useGetOrders, MasterOrderCard, EOrderStatus } from '@/entities/order';
import { InfiniteList, PageContainer, QueryBoundary, DashboardBackHeader } from '@/shared/ui';

type TTab = 'active' | 'done';

const TAB_STATUS: Record<TTab, EOrderStatus[]> = {
    active: [EOrderStatus.PENDING, EOrderStatus.CONFIRMED, EOrderStatus.IN_PROGRESS],
    done: [EOrderStatus.COMPLETED, EOrderStatus.CANCELLED],
};

const TAB_LABEL: Record<TTab, string> = {
    active: 'Активные',
    done: 'Выполненные',
};

export function MasterOrdersListPage() {
    return (
        <QueryBoundary errorMessage="Ошибка загрузки заказов">
            <MasterOrdersListContent />
        </QueryBoundary>
    );
}

function MasterOrdersListContent() {
    const [activeTab, setActiveTab] = useState<TTab>('active');
    const [isPending, startTransition] = useTransition();

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetOrders({
        limit: 20,
        status: TAB_STATUS[activeTab],
    });

    const orders = data.pages.flatMap((page) => page.items);

    const handleTabChange = (tab: TTab) => {
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
                <div role="tablist" className="tabs tabs-boxed bg-base-100">
                    {(Object.keys(TAB_STATUS) as TTab[]).map((tab) => (
                        <button
                            key={tab}
                            role="tab"
                            className={`tab ${activeTab === tab ? 'tab-active' : ''}`}
                            onClick={() => handleTabChange(tab)}
                        >
                            {TAB_LABEL[tab]}
                        </button>
                    ))}
                </div>

                {orders.length === 0 ? (
                    <div className="card bg-base-100 p-6 text-sm text-base-content/50 text-center">
                        {activeTab === 'active'
                            ? 'Нет активных заказов'
                            : 'Нет выполненных заказов'}
                    </div>
                ) : (
                    <InfiniteList
                        items={orders}
                        hasMore={!!hasNextPage}
                        isLoading={isFetchingNextPage}
                        onLoadMore={handleLoadMore}
                        renderItem={(order) => <MasterOrderCard order={order} />}
                        keyExtractor={(order) => order.id}
                        className="flex flex-col gap-3"
                    />
                )}
            </div>
        </PageContainer>
    );
}
