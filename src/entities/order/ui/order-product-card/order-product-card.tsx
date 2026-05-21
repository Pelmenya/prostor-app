import { CardImage } from '@/shared/ui';
import { formatPrice } from '@/shared/lib';
import { OrderPositionCount } from '../order-position-count/order-position-count';

type TOrderProductCardProps = {
    product: {
        id: string;
        name: string;
    };
    count: number;
    isLast: boolean;
    imageUrl?: string;
    isImageLoading?: boolean;
    price?: number;
};

export function OrderProductCard({
    product,
    count,
    isLast,
    imageUrl,
    isImageLoading,
    price,
}: TOrderProductCardProps) {
    return (
        <>
            <div className="flex items-center gap-2 justify-between">
                <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="max-w-[167px] sm:max-w-[383px] md:max-w-[559px] lg:max-w-[783px] xl:max-w-[959px] text-sm/4 line-clamp-3">
                        {product.name}
                    </p>
                    {price != null && (
                        <span className="text-xs text-base-content/50">{formatPrice(price)}</span>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <OrderPositionCount count={count} />
                    <CardImage
                        isLoading={isImageLoading ?? false}
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
