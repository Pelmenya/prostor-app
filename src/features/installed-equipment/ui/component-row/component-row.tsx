'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ShoppingCartIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import type { TInstalledComponent } from '@/shared/model';
import { formatDateRu } from '@/shared/lib';
import { productKeys, fetchProduct } from '@/entities/product';
import { useCartStore } from '@/entities/cart';
import {
    getResourcePercent,
    getProgressColor,
    getDaysLeft,
    useReplaceComponent,
} from '@/entities/installed-equipment';
import { CompactModal } from '@/shared/ui';

type TComponentRowProps = {
    component: TInstalledComponent;
    realEstateId: number;
};

function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ComponentRow({ component, realEstateId }: TComponentRowProps) {
    const queryClient = useQueryClient();
    const addProduct = useCartStore((s) => s.addProduct);
    const [isAdding, setIsAdding] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [addError, setAddError] = useState(false);
    const [isReplaceOpen, setIsReplaceOpen] = useState(false);
    const [replacedAt, setReplacedAt] = useState(getTodayString);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { mutate: replaceComponent, isPending: isReplacing } = useReplaceComponent(realEstateId);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

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
        setAddError(false);
        try {
            const product = await queryClient.fetchQuery({
                queryKey: productKeys.product(component.msProductId),
                queryFn: () => fetchProduct(component.msProductId),
                staleTime: 5 * 60 * 1000,
            });
            const price = product.salePrices?.[0]?.value ?? 0;
            addProduct(product, 1, price);
            setIsAdded(true);
            timerRef.current = setTimeout(() => setIsAdded(false), 2000);
        } catch {
            setAddError(true);
            timerRef.current = setTimeout(() => setAddError(false), 3000);
        } finally {
            setIsAdding(false);
        }
    };

    const handleReplace = () => {
        const [y, m, d] = replacedAt.split('-').map(Number);
        const isoDate = new Date(y, m - 1, d, 12, 0, 0).toISOString();
        replaceComponent(
            { componentId: component.id, replacedAt: isoDate },
            { onSuccess: () => setIsReplaceOpen(false) },
        );
    };

    return (
        <>
            <div className="flex flex-col gap-1.5 pt-3 border-t border-base-200">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium line-clamp-2">
                        {component.componentName}
                    </span>
                    <span className={`text-xs shrink-0 ${daysClassName}`}>{daysLabel}</span>
                </div>

                <progress
                    className={`progress ${progressColor} h-1.5 w-full`}
                    value={percent}
                    max={100}
                />

                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-base-content/50">
                        замена {formatDateRu(component.nextReplacementDate)}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setIsReplaceOpen(true)}
                            className="btn btn-xs btn-outline gap-1"
                        >
                            <ArrowPathIcon className="size-3" />
                            Заменено
                        </button>
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            disabled={isAdding || isAdded}
                            className={`btn btn-xs gap-1 ${addError ? 'btn-error' : 'btn-primary'}`}
                        >
                            {isAdding ? (
                                <span className="loading loading-spinner loading-xs" />
                            ) : isAdded ? (
                                <CheckIcon className="size-3" />
                            ) : (
                                <ShoppingCartIcon className="size-3" />
                            )}
                            {isAdding
                                ? 'В корзину'
                                : isAdded
                                  ? 'Добавлено'
                                  : addError
                                    ? 'Ошибка'
                                    : 'В корзину'}
                        </button>
                    </div>
                </div>
            </div>

            <CompactModal
                isOpen={isReplaceOpen}
                onClose={() => setIsReplaceOpen(false)}
                title="Дата замены"
            >
                <div className="flex flex-col gap-4">
                    <input
                        type="date"
                        className="input input-bordered w-full"
                        value={replacedAt}
                        max={getTodayString()}
                        onChange={(e) => setReplacedAt(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="btn btn-outline flex-1"
                            onClick={() => setIsReplaceOpen(false)}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary flex-1"
                            onClick={handleReplace}
                            disabled={!replacedAt || isReplacing}
                        >
                            {isReplacing ? (
                                <span className="loading loading-spinner loading-xs" />
                            ) : (
                                'Ок'
                            )}
                        </button>
                    </div>
                </div>
            </CompactModal>
        </>
    );
}
