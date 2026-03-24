'use client';

import type { TCartItem } from '@/entities/cart';
import { StickyTotalBar, type TLineItem } from '@/shared/ui';
import { EServiceCategory } from '@/entities/product';

function calculateCartItemTotals(cartItem: TCartItem | undefined) {
    if (!cartItem) {
        return {
            hasItems: false,
            productsTotal: 0,
            installationTotal: 0,
            serviceTotal: 0,
            productsCount: 0,
            installationCount: 0,
            serviceCount: 0,
            grandTotal: 0,
        };
    }

    const productsTotal = (cartItem.price ?? 0) * cartItem.count;
    const productsCount = cartItem.count;

    let installationTotal = 0;
    let serviceTotal = 0;
    let installationCount = 0;
    let serviceCount = 0;

    Object.values(cartItem.services).forEach((svc) => {
        if (!svc.checked || svc.count === 0) return;

        const servicePrice = (svc.price ?? 0) * svc.count;

        if (svc.serviceInfo.category === EServiceCategory.MONTAZH) {
            installationTotal += servicePrice;
            installationCount += svc.count;
        } else if (svc.serviceInfo.category === EServiceCategory.SERVISNOE_OBSLUZHIVANIE) {
            serviceTotal += servicePrice;
            serviceCount += svc.count;
        }
    });

    const grandTotal = productsTotal + installationTotal + serviceTotal;
    const hasItems =
        cartItem.count > 0 ||
        Object.values(cartItem.services).some((svc) => svc.checked && svc.count > 0);

    return {
        hasItems,
        productsTotal,
        installationTotal,
        serviceTotal,
        productsCount,
        installationCount,
        serviceCount,
        grandTotal,
    };
}

type TProductTotalProps = {
    cartItem: TCartItem | undefined;
};

export function ProductTotal({ cartItem }: TProductTotalProps) {
    const totals = calculateCartItemTotals(cartItem);

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
            actionLink="/cart"
            actionLabel="Оформить"
        />
    );
}
