import { CardImage } from '@/shared/ui';
import type { TProduct } from '@/shared/model';

type TSearchProductItemProps = {
    product: TProduct;
    imageUrl: string | undefined;
    isImageLoading: boolean;
    onClick: () => void;
};

export function SearchProductItem({
    product,
    imageUrl,
    isImageLoading,
    onClick,
}: TSearchProductItemProps) {
    return (
        <button
            type="button"
            className="flex items-center gap-3 p-3 rounded-2xl bg-base-200/50 hover:bg-base-200 transition-colors text-left w-full"
            onClick={onClick}
        >
            <CardImage
                src={imageUrl}
                isLoading={isImageLoading}
                className="w-12 h-14 rounded-xl shrink-0"
                imgClassName="size-full object-contain"
                alt={product.name}
            />
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium line-clamp-2">{product.name}</span>
                {product.description && (
                    <span className="text-xs text-base-content/50 line-clamp-1">
                        {product.description}
                    </span>
                )}
            </div>
        </button>
    );
}
