'use client';

import Link from 'next/link';

import type { TCartItem } from '@/entities/cart';
import { CardImage, Counter } from '@/shared/ui';
import { CartCardWrapper } from '@/entities/cart/ui/cart-card-wrapper';
import { formatPrice } from '@/shared/lib';

type TCartItemProps = {
    item: TCartItem;
    imageUrl?: string;
    isImageLoading?: boolean;
    onToggleSelected: (productId: string) => void;
    onUpdateCount: (productId: string, count: number) => void;
    onRemove: (productId: string, productName: string) => void;
};

export function CartItem({
    item,
    imageUrl,
    isImageLoading,
    onToggleSelected,
    onUpdateCount,
    onRemove,
}: TCartItemProps) {
    const { product, count, price, selectedForCheckout } = item;

    const handleDecrement = () => {
        if (count - 1 <= 0) {
            onRemove(product.id, product.name);
        } else {
            onUpdateCount(product.id, count - 1);
        }
    };

    const handleIncrement = () => {
        onUpdateCount(product.id, count + 1);
    };

    return (
        <CartCardWrapper variant="product">
            {/* Мобилка: 2 строки */}
            <div className="flex flex-col gap-4 md:hidden">
                <div className="flex items-center justify-between">
                    <Link
                        href={`/product/${product.id}`}
                        className="flex cursor-pointer items-center gap-2"
                    >
                        <CardImage
                            src={imageUrl}
                            isLoading={isImageLoading}
                            className="h-16 w-12 shrink-0 rounded-2xl"
                            imgClassName="size-full object-contain"
                            alt={product.name}
                        />
                        <h5 className="line-clamp-2 text-sm leading-[110%]">{product.name}</h5>
                    </Link>
                    <label className="flex cursor-pointer items-center justify-center p-2 -mr-2">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={selectedForCheckout}
                            onChange={() => onToggleSelected(product.id)}
                        />
                    </label>
                </div>

                <hr className="h-px text-base-300" />

                <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary leading-[110%]">
                        {formatPrice(price)}
                    </span>
                    <Counter
                        count={count}
                        onDecrement={handleDecrement}
                        onIncrement={handleIncrement}
                        minCount={0}
                        size="small"
                    />
                </div>
            </div>

            {/* Десктоп: 1 строка */}
            <div className="hidden md:flex md:items-center md:gap-4">
                <Link
                    href={`/product/${product.id}`}
                    className="flex cursor-pointer items-center gap-2 flex-1 min-w-0"
                >
                    <CardImage
                        src={imageUrl}
                        isLoading={isImageLoading}
                        className="h-16 w-12 shrink-0 rounded-2xl"
                        imgClassName="size-full object-contain"
                        alt={product.name}
                    />
                    <h5 className="line-clamp-2 text-sm leading-[110%]">{product.name}</h5>
                </Link>
                <span className="shrink-0 font-semibold text-primary leading-[110%]">
                    {formatPrice(price)}
                </span>
                <Counter
                    count={count}
                    onDecrement={handleDecrement}
                    onIncrement={handleIncrement}
                    minCount={0}
                    size="small"
                />
                <label className="flex cursor-pointer items-center justify-center p-2">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selectedForCheckout}
                        onChange={() => onToggleSelected(product.id)}
                    />
                </label>
            </div>
        </CartCardWrapper>
    );
}
