'use client';

import type { TCartItem } from '@/entities/cart';
import { useProductThumbnails } from '@/entities/product';
import { CardImage } from '@/shared/ui';
import { formatPrice } from '@/shared/lib';

type TCheckoutProductsListProps = {
    items: Record<string, TCartItem>;
};

export function CheckoutProductsList({ items }: TCheckoutProductsListProps) {
    const products = Object.values(items).filter(
        (item) => item.selectedForCheckout && item.count > 0,
    );

    const { imageUrls, loadingIds } = useProductThumbnails(products.map((item) => item.product.id));

    if (products.length === 0) return null;

    return (
        <div className="flex flex-col gap-2">
            {products.map((item) => (
                <div
                    key={item.product.id}
                    className="rounded-2xl bg-base-100 p-3 flex items-center gap-3"
                >
                    <CardImage
                        src={imageUrls[item.product.id]}
                        isLoading={loadingIds.has(item.product.id)}
                        className="h-14 w-10 shrink-0 rounded-xl"
                        imgClassName="size-full object-contain"
                        alt={item.product.name}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{item.product.name}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm opacity-60">× {item.count}</span>
                        <span className="text-sm font-semibold text-primary">
                            {formatPrice(item.price * item.count)}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
