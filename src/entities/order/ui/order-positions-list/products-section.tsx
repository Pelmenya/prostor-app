import { CubeIcon } from '@heroicons/react/20/solid';
import type { TCartItem } from '@/shared/model';
import { OrderProductCard } from '../order-product-card/order-product-card';

type TProductsSectionProps = {
    items: TCartItem[];
    imageUrls?: Record<string, string | undefined>;
    loadingIds?: Set<string>;
};

export function ProductsSection({ items, imageUrls, loadingIds }: TProductsSectionProps) {
    const filtered = items.filter((item) => item?.count > 0 && item?.product);
    if (!filtered.length) return null;

    return (
        <div className="relative border border-base-300 rounded-2xl p-4 flex flex-col gap-3">
            <span className="badge badge-sm border-base-300 absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                <span className="flex items-center gap-2 font-semibold leading-6">
                    <CubeIcon className="size-3" />
                    Товары
                </span>
            </span>
            {filtered.map((item, idx) => (
                <OrderProductCard
                    key={item.product?.id ?? idx}
                    product={item.product}
                    count={item.count}
                    isLast={idx === filtered.length - 1}
                    imageUrl={imageUrls?.[item.product?.id]}
                    isImageLoading={loadingIds?.has(item.product?.id) ?? false}
                />
            ))}
        </div>
    );
}
