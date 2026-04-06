import type { TOrder } from '@/entities/order';
import { OrderList, OrdersTabSwitcher, OrdersNotFound } from '@/features/orders';
import type { TTabType } from '@/features/orders';
import { PageContainer, PageTitle } from '@/shared/ui';

type TOrdersPageContentProps = {
    orders: TOrder[];
    activeTab: TTabType;
    onTabChange: (tab: TTabType) => void;
    hasOrders: boolean;
    isInitialLoading: boolean;
    hasAnyOrders: boolean;
    isCountsLoaded: boolean;
    hasMore: boolean;
    isLoadingMore: boolean;
    onLoadMore: () => void;
    actualCount: number | undefined;
    completedCount: number | undefined;
    isActualCountLoading: boolean;
    isCompletedCountLoading: boolean;
    imageUrls: Record<string, string | undefined>;
    loadingIds: Set<string>;
};

export function OrdersPageContent({
    orders,
    activeTab,
    onTabChange,
    hasOrders,
    isInitialLoading,
    hasAnyOrders,
    isCountsLoaded,
    hasMore,
    isLoadingMore,
    onLoadMore,
    actualCount,
    completedCount,
    isActualCountLoading,
    isCompletedCountLoading,
    imageUrls,
    loadingIds,
}: TOrdersPageContentProps) {
    return (
        <PageContainer>
            <div className="flex flex-col gap-4 lg:gap-6">
                <PageTitle>Заказы</PageTitle>

                {hasAnyOrders && (
                    <OrdersTabSwitcher
                        activeTab={activeTab}
                        onTabChange={onTabChange}
                        actualCount={actualCount}
                        completedCount={completedCount}
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
                        hasMore={hasMore}
                        isLoading={isLoadingMore}
                        onLoadMore={onLoadMore}
                        imageUrls={imageUrls}
                        loadingIds={loadingIds}
                    />
                ) : isCountsLoaded ? (
                    <OrdersNotFound type="tab" href="/catalog" />
                ) : null}
            </div>
        </PageContainer>
    );
}

