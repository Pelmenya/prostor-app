import { CardImage } from '@/shared/ui';
import { formatPrice, getSalePrices } from '@/shared/lib';
import type { TProduct } from '@/entities/product';
import { SearchItem } from '../search-item/search-item';

type TSearchProductItemProps = {
    product: TProduct;
    imageUrl: string | null;
    isImageLoading: boolean;
    onClose: () => void;
};

export function SearchProductItem({
    product,
    imageUrl,
    isImageLoading,
    onClose,
}: TSearchProductItemProps) {
    const price = getSalePrices(product.salePrices)[0]?.value;

    return (
        <SearchItem href={`/product/${product.id}`} onClose={onClose}>
            <CardImage
                src={imageUrl}
                isLoading={isImageLoading}
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
