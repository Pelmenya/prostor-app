'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/solid';
import { useGetOrders, OrderStatus } from '@/entities/order';
import { OrdersTabSwitcher, TAB_STATUS_PRESETS } from '@/features/orders';
import type { TTabType } from '@/features/orders';
import { curatorOrderPath, CURATOR_ORDERS_PATH } from '@/shared/config';
import { formatDateRu, cn } from '@/shared/lib';
import { PageContainer, DashboardBackHeader, QueryBoundary, InfiniteList } from '@/shared/ui';
import type { TOrder } from '@/entities/order';

export function CuratorOrdersPage() {
    return (
        <QueryBoundary errorMessage="Ошибка загрузки заказов">
            <CuratorOrdersContent />
        </QueryBoundary>
    );
}

function CuratorOrdersContent() {
    const [activeTab, setActiveTab] = useState<TTabType>('actual');
    const [isPending, startTransition] = useTransition();

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetOrders({
        limit: 20,
        status: [...TAB_STATUS_PRESETS[activeTab]],
    });

    const orders = data.pages.flatMap((p) => p.items);

    const handleTabChange = (tab: TTabType) => {
        startTransition(() => setActiveTab(tab));
    };

    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader title="Заказы" fallbackHref={CURATOR_ORDERS_PATH} />
            <div
                className={cn(
                    'flex flex-col gap-4 max-w-lg mx-auto py-4',
                    isPending && 'opacity-60 transition-opacity',
                )}
            >
                <OrdersTabSwitcher
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    actualLabel="Активные"
                    completedLabel="Завершённые"
                />

                {orders.length === 0 ? (
                    <div className="card bg-base-100 p-6 text-center">
                        <p className="text-sm text-base-content/40">Заказов нет</p>
                    </div>
                ) : (
                    <InfiniteList
                        items={orders}
                        hasMore={!!hasNextPage}
                        isLoading={isFetchingNextPage}
                        onLoadMore={() => {
                            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
                        }}
                        keyExtractor={(order) => order.id}
                        className="flex flex-col gap-2"
                        renderItem={(order) => <CuratorOrderCard order={order} />}
                    />
                )}
            </div>
        </PageContainer>
    );
}

function CuratorOrderCard({ order }: { order: TOrder }) {
    const clientName = order.client
        ? [order.client.first_name, order.client.last_name].filter(Boolean).join(' ') ||
          `ID ${order.client.id}`
        : null;
    const executorName = order.executor
        ? [order.executor.first_name, order.executor.last_name].filter(Boolean).join(' ') ||
          `ID ${order.executor.id}`
        : null;

    return (
        <Link
            href={curatorOrderPath(order.id)}
            className="card bg-base-100 px-4 py-3 flex flex-row items-center gap-3 hover:bg-base-200 transition-colors active:scale-[0.99]"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Заказ #{order.id}</span>
                    <OrderStatus status={order.status} />
                </div>
                <p className="text-xs text-base-content/40 mt-0.5">
                    {formatDateRu(order.createdAt)}
                </p>
                <div className="flex flex-col gap-0.5 mt-1">
                    {clientName && (
                        <p className="text-xs text-base-content/60 truncate">
                            Клиент: {clientName}
                        </p>
                    )}
                    <p className="text-xs text-base-content/60 truncate">
                        {executorName ? `Мастер: ${executorName}` : 'Без мастера'}
                    </p>
                </div>
            </div>
            <ChevronRightIcon className="size-4 text-base-content/30 shrink-0" />
        </Link>
    );
}
