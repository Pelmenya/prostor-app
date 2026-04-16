'use client';

import { useCallback } from 'react';
import { InfiniteList } from '@/shared/ui';
import type { TProduct } from '@/entities/product';
import { SearchProductItem } from '../search-product-item/search-product-item';

type TSearchListProps = {
    items: TProduct[];
    hasMore: boolean;
    isLoading: boolean;
    isFetching: boolean;
    onLoadMore: () => void;
    onClose: () => void;
};

export function SearchList({
    items,
    hasMore,
    isLoading,
    isFetching,
    onLoadMore,
    onClose,
}: TSearchListProps) {
    const renderItem = useCallback(
        (product: TProduct) => <SearchProductItem product={product} onClose={onClose} />,
        [onClose],
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
