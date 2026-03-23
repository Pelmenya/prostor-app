'use client';

import Link from 'next/link';

import type { TCartItem } from '@/entities/cart';
import { CardImage, Counter } from '@/shared/ui';
import { formatPrice } from '@/shared/lib';

type TCartItemProps = {
    item: TCartItem;
    onToggleSelected: (productId: string) => void;
    onUpdateCount: (productId: string, count: number) => void;
    onRemove: (productId: string, productName: string) => void;
};

export function CartItem({ item, onToggleSelected, onUpdateCount, onRemove }: TCartItemProps) {
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
        <div className="card bg-base-100 p-4">
            <div className="flex items-center justify-between">
                <Link
                    href={`/product/${product.id}`}
                    className="flex cursor-pointer items-center gap-2"
                >
                    <CardImage
                        className="h-16 w-12 shrink-0 rounded-2xl"
                        imgClassName="size-full object-contain"
                        alt={product.name}
                    />
                    <h5 className="line-clamp-2 text-sm leading-[110%]">{product.name}</h5>
                </Link>

                <label className="-mr-2 flex cursor-pointer items-center justify-center p-2">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selectedForCheckout}
                        onChange={() => onToggleSelected(product.id)}
                    />
                </label>
            </div>

            <div className="divider m-0" />

            <div className="flex items-center justify-between">
                <span className="font-semibold">{formatPrice(price)}</span>
                <Counter
                    count={count}
                    onDecrement={handleDecrement}
                    onIncrement={handleIncrement}
                    minCount={0}
                    size="small"
                />
            </div>
        </div>
    );
}
