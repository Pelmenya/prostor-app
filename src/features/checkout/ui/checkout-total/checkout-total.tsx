'use client';

import { useCartStore } from '@/entities/cart';
import { StickyTotalBar } from '@/shared/ui';
import type { TLineItem } from '@/shared/ui';
import { calculateSelectedTotals } from '@/entities/cart';

type TCheckoutTotalProps = {
    clientVisitPrice?: number;
    onAction: () => void;
    disabled?: boolean;
    actionLabel?: string;
    isLoading?: boolean;
};

export function CheckoutTotal({
    clientVisitPrice,
    onAction,
    disabled,
    actionLabel = 'Оформить',
    isLoading,
}: TCheckoutTotalProps) {
    const items = useCartStore((s) => s.items);
    const totals = calculateSelectedTotals(items);

    const lines: TLineItem[] = [];
    if (totals.productsCount > 0) {
        lines.push({ label: 'Товары', count: totals.productsCount, total: totals.productsTotal });
    }
    if (totals.installationCount > 0) {
        lines.push({
            label: 'Монтаж',
            count: totals.installationCount,
            total: totals.installationTotal,
        });
    }
    if (totals.serviceCount > 0) {
        lines.push({ label: 'Сервис', count: totals.serviceCount, total: totals.serviceTotal });
    }
    if (clientVisitPrice !== undefined) {
        lines.push({ label: 'Выезд', total: clientVisitPrice });
    }

    const grandTotal = totals.grandTotal + (clientVisitPrice ?? 0);

    if (!totals.hasItems) return null;

    return (
        <StickyTotalBar
            grandTotal={grandTotal}
            lines={lines}
            actionLink=""
            actionLabel={isLoading ? 'Оформление...' : actionLabel}
            onAction={onAction}
            disabled={disabled || isLoading}
        />
    );
}
