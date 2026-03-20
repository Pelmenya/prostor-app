'use client';

import { useRouter } from 'next/navigation';
import { CardWrapper } from '@/shared/ui/card-wrapper';
import { CardImage } from '@/shared/ui/card-image';
import { formatPrice } from '@/shared/lib';
import type { TProduct } from '@/entities/product';
import { useProductImages, getImageProxyUrl } from '@/entities/product';

type TProductCardProps = {
    product: TProduct;
};

export function ProductCard({ product }: TProductCardProps) {
    const router = useRouter();

    const { data: images, isLoading: isImagesLoading } = useProductImages(product.id);
    const mainImage = images?.[0];
    const imageUrl = mainImage ? getImageProxyUrl(mainImage.meta.downloadHref) : null;

    const price = product.salePrices?.[0]?.value;

    return (
        <CardWrapper
            onClick={() => router.push(`/product/${product.id}`)}
            className="flex-col gap-4 min-h-71.5"
        >
            <CardImage
                src={imageUrl}
                isLoading={isImagesLoading}
                alt={product.name}
                className="w-full h-26.5"
                imgClassName="h-full w-20 object-contain"
            />
            <div className="flex flex-col justify-between size-full">
                <div className="flex flex-col gap-2">
                    <h3 className="font-medium text-sm leading-[110%] line-clamp-3">
                        {product.name}
                    </h3>
                    <p className="text-ex-min leading-[150%] line-clamp-3">{product.description}</p>
                </div>
                {price != null && (
                    <p className="mt-2 text-sm font-semibold text-primary">{formatPrice(price)}</p>
                )}
            </div>
        </CardWrapper>
    );
}
