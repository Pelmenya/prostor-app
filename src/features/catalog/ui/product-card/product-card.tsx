'use client';

import { useRouter } from 'next/navigation';
import { CardWrapper } from '@/shared/ui/card-wrapper';
import { CardImage } from '@/shared/ui/card-image';
import type { TProduct } from '@/entities/product';

type TProductCardProps = {
    product: TProduct;
};

function formatPrice(value: number): string {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
    }).format(value / 100);
}

export function ProductCard({ product }: TProductCardProps) {
    const router = useRouter();

    const imageUrl = product.images?.[0]?.miniatureHref ?? null;
    const price = product.salePrices?.[0]?.value;

    return (
        <CardWrapper variant="no-gap" onClick={() => router.push(`/product/${product.id}`)}>
            <CardImage src={imageUrl} alt={product.name} />
            <div className="flex flex-col gap-1 p-3">
                <h3 className="text-sm font-medium line-clamp-3">{product.name}</h3>
                {product.description && (
                    <p className="text-ex-min text-base-content/60 line-clamp-3">
                        {product.description}
                    </p>
                )}
                {price != null && (
                    <p className="mt-1 text-sm font-semibold text-primary">{formatPrice(price)}</p>
                )}
            </div>
        </CardWrapper>
    );
}
