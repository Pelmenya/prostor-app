'use client';

import { useCartStore } from '@/entities/cart';
import { StickyTotalBar } from '@/shared/ui';
import type { TLineItem } from '@/shared/ui';
import { calculateSelectedTotals } from '../../lib/calculate-selected-totals';

export function CartTotal() {
    const items = useCartStore((s) => s.items);
    const totals = calculateSelectedTotals(items);

    if (!totals.hasItems) return null;

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

    return (
        <StickyTotalBar
            grandTotal={totals.grandTotal}
            lines={lines}
            actionLink="/checkout"
            actionLabel="Оформить"
        />
    );
}
