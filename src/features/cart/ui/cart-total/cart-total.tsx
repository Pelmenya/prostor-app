'use client';

import { useCartStore } from '@/entities/cart';
import { StickyTotalBar } from '@/shared/ui';
import type { TLineItem } from '@/shared/ui';
import { calculateSelectedTotals } from '@/features/cart/lib/calculate-selected-totals';

export function CartTotal() {
    const items = useCartStore((s) => s.items);
    const totals = calculateSelectedTotals(items);

    if (!totals.hasItems) return null;

    const lines: TLineItem[] = [];

    if (totals.productsTotal > 0) {
        lines.push({ label: 'Товары', count: totals.productsCount, total: totals.productsTotal });
    }
    if (totals.installationTotal > 0) {
        lines.push({
            label: 'Монтаж',
            count: totals.installationCount,
            total: totals.installationTotal,
        });
    }
    if (totals.serviceTotal > 0) {
        lines.push({ label: 'Сервис', count: totals.serviceCount, total: totals.serviceTotal });
    }

    return (
        <StickyTotalBar
            grandTotal={totals.grandTotal}
            lines={lines}
            actionLink="/checkout"
            actionLabel="Оформить"
        />
    );
}
