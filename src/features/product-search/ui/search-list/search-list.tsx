import { InfiniteList } from '@/shared/ui';
import type { TProduct } from '@/entities/product';
import { SearchProductItem } from '../search-product-item/search-product-item';

type TSearchListProps = {
    items: TProduct[];
    hasMore: boolean;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    imageUrls: Record<string, string | undefined>;
    loadingIds: Set<string>;
    onLoadMore: () => void;
    onClose: () => void;
    onRetry: () => void;
};

export function SearchList({
    items,
    hasMore,
    isLoading,
    isFetching,
    isError,
    imageUrls,
    loadingIds,
    onLoadMore,
    onClose,
    onRetry,
}: TSearchListProps) {
    const renderItem = (product: TProduct) => (
        <SearchProductItem
            product={product}
            imageUrl={imageUrls[product.id] ?? null}
            isImageLoading={loadingIds.has(product.id)}
            onClose={onClose}
        />
    );

    return (
        <InfiniteList
            items={items}
            hasMore={hasMore}
            isLoading={isLoading || isFetching}
            isError={isError}
            onLoadMore={onLoadMore}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            className="flex flex-col"
            emptyComponent={
                <p className="text-center text-base-content/60 py-8">Товары не найдены</p>
            }
            errorComponent={
                <div className="flex flex-col items-center gap-3 py-8">
                    <p className="text-center text-error">Ошибка загрузки</p>
                    <button type="button" className="btn btn-sm btn-outline" onClick={onRetry}>
                        Повторить
                    </button>
                </div>
            }
        />
    );
}
