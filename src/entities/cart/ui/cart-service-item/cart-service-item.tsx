'use client';

import type { TCartServiceItem } from '@/entities/cart';
import { Counter } from '@/shared/ui';
import { formatPrice } from '@/shared/lib';

type TCartServiceItemProps = {
    service: TCartServiceItem;
    productId: string;
    isLast?: boolean;
    onToggleSelected: (productId: string, serviceId: string) => void;
    onUpdateCount: (productId: string, serviceId: string, count: number) => void;
    onRemove: (productId: string, serviceId: string) => void;
};

export function CartServiceItem({
    service,
    productId,
    isLast = false,
    onToggleSelected,
    onUpdateCount,
    onRemove,
}: TCartServiceItemProps) {
    const { service: svc, count, price, selectedForCheckout } = service;

    const handleDecrement = () => {
        if (count - 1 <= 0) {
            onRemove(productId, svc.id);
        } else {
            onUpdateCount(productId, svc.id, count - 1);
        }
    };

    const handleIncrement = () => {
        onUpdateCount(productId, svc.id, count + 1);
    };

    return (
        <>
            {/* Мобилка: 2 строки */}
            <div className="flex flex-col gap-2 md:hidden">
                <div className="flex items-center justify-between">
                    <p className="line-clamp-2 text-sm leading-[110%]">{svc.name}</p>
                    <label className="flex cursor-pointer items-center justify-center p-2 -mr-2">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={selectedForCheckout}
                            onChange={() => onToggleSelected(productId, svc.id)}
                        />
                    </label>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold tracking-tight text-primary leading-[110%]">
                        {formatPrice(price)}
                    </p>
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
                <p className="line-clamp-2 flex-1 min-w-0 text-sm leading-[110%]">{svc.name}</p>
                <p className="shrink-0 text-sm font-semibold tracking-tight text-primary leading-[110%]">
                    {formatPrice(price)}
                </p>
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
                        onChange={() => onToggleSelected(productId, svc.id)}
                    />
                </label>
            </div>

            {!isLast && <hr className="h-px text-base-300" />}
        </>
    );
}
