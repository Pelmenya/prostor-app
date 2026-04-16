'use client';

import { memo } from 'react';
import { CardImage } from '@/shared/ui';
import { formatPrice } from '@/shared/lib';
import { useProductImages, getImageProxyUrl } from '@/entities/product';
import type { TProduct } from '@/entities/product';
import { SearchItem } from '../search-item/search-item';

const SALE_PRICE_TYPES = (process.env.NEXT_PUBLIC_SALE_PRICES ?? 'Приложение').split('__');

type TSearchProductItemProps = {
    product: TProduct;
    onClose: () => void;
};

function SearchProductItemComponent({ product, onClose }: TSearchProductItemProps) {
    const { data: images, isLoading: isImagesLoading } = useProductImages(product.id);
    const mainImage = images?.[0];
    const imageUrl = mainImage ? getImageProxyUrl(mainImage.meta.downloadHref) : null;

    const price = product.salePrices?.find(
        (p) => p.priceType.name && SALE_PRICE_TYPES.includes(p.priceType.name),
    )?.value;

    return (
        <SearchItem href={`/product/${product.id}`} onClose={onClose}>
            <CardImage
                src={imageUrl}
                isLoading={isImagesLoading}
                alt={product.name}
                className="w-12 h-16 shrink-0"
                imgClassName="size-full object-contain"
            />
            <div className="flex flex-col gap-1 min-w-0">
                <span className="font-medium text-sm line-clamp-2">{product.name}</span>
                {price != null && (
                    <span className="text-sm font-semibold text-primary">{formatPrice(price)}</span>
                )}
            </div>
        </SearchItem>
    );
}

export const SearchProductItem = memo(SearchProductItemComponent);
