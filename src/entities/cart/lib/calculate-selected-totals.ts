import type { TCartItem } from '@/entities/cart';
import { EServiceCategory } from '@/shared/model';

export type TSelectedTotals = {
    hasItems: boolean;
    productsTotal: number;
    productsCount: number;
    installationTotal: number;
    installationCount: number;
    serviceTotal: number;
    serviceCount: number;
    grandTotal: number;
};

export function calculateSelectedTotals(items: Record<string, TCartItem>): TSelectedTotals {
    let productsTotal = 0;
    let productsCount = 0;
    let installationTotal = 0;
    let installationCount = 0;
    let serviceTotal = 0;
    let serviceCount = 0;

    for (const item of Object.values(items)) {
        if (item.selectedForCheckout && item.count > 0) {
            productsTotal += item.price * item.count;
            productsCount += item.count;
        }

        for (const svc of Object.values(item.services)) {
            if (!svc.checked || svc.count <= 0 || !svc.selectedForCheckout) continue;

            const price = svc.price * svc.count;

            if (svc.serviceInfo.category === EServiceCategory.MONTAZH) {
                installationTotal += price;
                installationCount += svc.count;
            } else {
                serviceTotal += price;
                serviceCount += svc.count;
            }
        }
    }

    const grandTotal = productsTotal + installationTotal + serviceTotal;
    const hasItems = productsCount > 0 || installationCount > 0 || serviceCount > 0;

    return {
        hasItems,
        productsTotal,
        productsCount,
        installationTotal,
        installationCount,
        serviceTotal,
        serviceCount,
        grandTotal,
    };
}
