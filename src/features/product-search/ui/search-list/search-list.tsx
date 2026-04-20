'use client';

import { InfiniteList } from '@/shared/ui';
import type { TProduct } from '@/entities/product';
import { SearchProductItem } from '../search-product-item/search-product-item';

type TSearchListProps = {
    items: TProduct[];
    hasMore: boolean;
    isLoading: boolean;
    isFetching: boolean;
    imageUrls: Record<string, string | undefined>;
    loadingIds: Set<string>;
    onLoadMore: () => void;
    onClose: () => void;
};

export function SearchList({
    items,
    hasMore,
    isLoading,
    isFetching,
    imageUrls,
    loadingIds,
    onLoadMore,
    onClose,
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
            onLoadMore={onLoadMore}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            className="flex flex-col"
            emptyComponent={
                <p className="text-center text-base-content/60 py-8">Товары не найдены</p>
            }
        />
    );
}
