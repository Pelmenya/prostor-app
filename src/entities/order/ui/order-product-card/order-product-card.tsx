'use client';

import { useProductImages, getImageProxyUrl } from '@/entities/product';
import { CardImage } from '@/shared/ui';
import { OrderPositionCount } from '../order-position-count/order-position-count';

type TOrderProductCardProps = {
    product: {
        id: string;
        name: string;
    };
    count: number;
    isLast: boolean;
};

export function OrderProductCard({ product, count, isLast }: TOrderProductCardProps) {
    const { data: images, isLoading } = useProductImages(product.id);
    const mainImage = images?.[0];
    const imageUrl = mainImage ? getImageProxyUrl(mainImage.meta.downloadHref) : undefined;

    return (
        <>
            <div className="flex items-center gap-2 justify-between">
                <p className="max-w-[167px] sm:max-w-[383px] md:max-w-[559px] lg:max-w-[783px] xl:max-w-[959px] text-sm/4 line-clamp-3">
                    {product.name}
                </p>
                <div className="flex items-center gap-2">
                    <OrderPositionCount count={count} />
                    <CardImage
                        isLoading={isLoading}
                        src={imageUrl}
                        className="w-12 h-16 rounded-2xl"
                        imgClassName="size-full object-contain"
                        alt={product.name}
                    />
                </div>
            </div>
            {!isLast && <div className="divider my-0" />}
        </>
    );
}
