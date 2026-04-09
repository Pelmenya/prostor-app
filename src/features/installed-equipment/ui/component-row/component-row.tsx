'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import type { TInstalledComponent } from '@/shared/model';
import { formatDateRu } from '@/shared/lib';
import { productKeys, fetchProduct } from '@/entities/product';
import { useCartStore } from '@/entities/cart';
import { getResourcePercent, getProgressColor, getDaysLeft } from '@/entities/installed-equipment';

type TComponentRowProps = {
    component: TInstalledComponent;
};

export function ComponentRow({ component }: TComponentRowProps) {
    const queryClient = useQueryClient();
    const addProduct = useCartStore((s) => s.addProduct);
    const [isAdding, setIsAdding] = useState(false);
    const [isAdded, setIsAdded] = useState(false);

    const percent = getResourcePercent(component.installedAt, component.nextReplacementDate);
    const progressColor = getProgressColor(percent);
    const daysLeft = getDaysLeft(component.nextReplacementDate);

    const daysLabel =
        daysLeft < 0
            ? `просрочено на ${Math.abs(daysLeft)} дн.`
            : daysLeft === 0
              ? 'замена сегодня'
              : `${daysLeft} дн.`;

    const daysClassName =
        daysLeft <= 0
            ? 'text-error font-semibold'
            : daysLeft <= 7
              ? 'text-error'
              : daysLeft <= 30
                ? 'text-warning'
                : 'text-base-content/50';

    const handleAddToCart = async () => {
        if (isAdding || isAdded) return;
        setIsAdding(true);
        try {
            const product = await queryClient.fetchQuery({
                queryKey: productKeys.product(component.msProductId),
                queryFn: () => fetchProduct(component.msProductId),
                staleTime: 5 * 60 * 1000,
            });
            const price = product.salePrices?.[0]?.value ?? 0;
            addProduct(product, 1, price);
            setIsAdded(true);
            setTimeout(() => setIsAdded(false), 2000);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="flex flex-col gap-1.5 pt-3 border-t border-base-200">
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium line-clamp-2">{component.componentName}</span>
                <span className={`text-xs shrink-0 ${daysClassName}`}>{daysLabel}</span>
            </div>

            <progress
                className={`progress ${progressColor} h-1.5 w-full`}
                value={percent}
                max={100}
            />

            <div className="flex items-center justify-between">
                <span className="text-xs text-base-content/50">
                    замена {formatDateRu(component.nextReplacementDate)}
                </span>
                <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isAdding || isAdded}
                    className="btn btn-xs btn-primary gap-1"
                >
                    {isAdding ? (
                        <span className="loading loading-spinner loading-xs" />
                    ) : isAdded ? (
                        <CheckIcon className="size-3" />
                    ) : (
                        <ShoppingCartIcon className="size-3" />
                    )}
                    {isAdded ? 'Добавлено' : 'В корзину'}
                </button>
            </div>
        </div>
    );
}
