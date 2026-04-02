import { describe, it, expect } from 'vitest';

import { EServiceCategory } from '@/shared/model';
import type { TCartItem } from '@/entities/cart';

import { calculateSelectedTotals } from './calculate-selected-totals';

// ---- Фабрики ----

function makeProduct(overrides?: Partial<TCartItem>): TCartItem {
    return {
        product: { id: 'prod-1', name: 'Аквафор DWM-101S' },
        count: 1,
        price: 1500000,
        selectedForCheckout: true,
        services: {},
        ...overrides,
    };
}

function makeService(
    category: EServiceCategory | undefined,
    overrides?: Partial<TCartItem['services'][string]>,
): TCartItem['services'][string] {
    return {
        serviceInfo: { id: 'svc-1', name: 'Услуга', category },
        count: 1,
        price: 100000,
        checked: true,
        selectedForCheckout: true,
        ...overrides,
    };
}

// ---- Тесты ----

describe('calculateSelectedTotals', () => {
    it('возвращает нули для пустой корзины', () => {
        const result = calculateSelectedTotals({});

        expect(result.hasItems).toBe(false);
        expect(result.grandTotal).toBe(0);
        expect(result.productsTotal).toBe(0);
        expect(result.installationTotal).toBe(0);
        expect(result.serviceTotal).toBe(0);
    });

    it('считает выбранный товар', () => {
        const items = { 'prod-1': makeProduct({ count: 2, price: 500000 }) };
        const result = calculateSelectedTotals(items);

        expect(result.productsTotal).toBe(1000000);
        expect(result.productsCount).toBe(2);
        expect(result.hasItems).toBe(true);
        expect(result.grandTotal).toBe(1000000);
    });

    it('не считает товар снятый с выбора (selectedForCheckout: false)', () => {
        const items = { 'prod-1': makeProduct({ selectedForCheckout: false }) };
        const result = calculateSelectedTotals(items);

        expect(result.productsTotal).toBe(0);
        expect(result.productsCount).toBe(0);
        expect(result.hasItems).toBe(false);
    });

    it('считает услугу категории MONTAZH в installationTotal', () => {
        const items = {
            'prod-1': makeProduct({
                services: {
                    'svc-1': makeService(EServiceCategory.MONTAZH, { count: 2, price: 150000 }),
                },
            }),
        };
        const result = calculateSelectedTotals(items);

        expect(result.installationTotal).toBe(300000);
        expect(result.installationCount).toBe(2);
        expect(result.serviceTotal).toBe(0);
    });

    it('считает услугу категории SERVISNOE_OBSLUZHIVANIE в serviceTotal', () => {
        const items = {
            'prod-1': makeProduct({
                services: {
                    'svc-1': makeService(EServiceCategory.SERVISNOE_OBSLUZHIVANIE, {
                        price: 80000,
                    }),
                },
            }),
        };
        const result = calculateSelectedTotals(items);

        expect(result.serviceTotal).toBe(80000);
        expect(result.serviceCount).toBe(1);
        expect(result.installationTotal).toBe(0);
    });

    it('считает услугу без категории в serviceTotal (не теряет из grandTotal)', () => {
        const items = {
            'prod-1': makeProduct({
                services: {
                    'svc-1': makeService(undefined, { price: 50000 }),
                },
            }),
        };
        const result = calculateSelectedTotals(items);

        expect(result.serviceTotal).toBe(50000);
        expect(result.serviceCount).toBe(1);
        expect(result.grandTotal).toBe(1500000 + 50000);
    });

    it('не считает unchecked услугу', () => {
        const items = {
            'prod-1': makeProduct({
                services: {
                    'svc-1': makeService(EServiceCategory.MONTAZH, { checked: false }),
                },
            }),
        };
        const result = calculateSelectedTotals(items);

        expect(result.installationTotal).toBe(0);
        expect(result.grandTotal).toBe(1500000);
    });

    it('не считает услугу с selectedForCheckout: false', () => {
        const items = {
            'prod-1': makeProduct({
                services: {
                    'svc-1': makeService(EServiceCategory.MONTAZH, { selectedForCheckout: false }),
                },
            }),
        };
        const result = calculateSelectedTotals(items);

        expect(result.installationTotal).toBe(0);
    });

    it('суммирует несколько товаров и услуг разных категорий', () => {
        const items: Record<string, TCartItem> = {
            'prod-1': makeProduct({
                product: { id: 'prod-1', name: 'Товар 1' },
                count: 1,
                price: 1000000,
                services: {
                    'svc-montazh': makeService(EServiceCategory.MONTAZH, { price: 200000 }),
                    'svc-servis': makeService(EServiceCategory.SERVISNOE_OBSLUZHIVANIE, {
                        serviceInfo: {
                            id: 'svc-servis',
                            name: 'Сервис',
                            category: EServiceCategory.SERVISNOE_OBSLUZHIVANIE,
                        },
                        price: 100000,
                    }),
                },
            }),
            'prod-2': makeProduct({
                product: { id: 'prod-2', name: 'Товар 2' },
                count: 3,
                price: 500000,
                services: {},
            }),
        };

        const result = calculateSelectedTotals(items);

        expect(result.productsTotal).toBe(1000000 + 3 * 500000);
        expect(result.installationTotal).toBe(200000);
        expect(result.serviceTotal).toBe(100000);
        expect(result.grandTotal).toBe(1000000 + 1500000 + 200000 + 100000);
        expect(result.hasItems).toBe(true);
    });

    it('grandTotal корректен при смешанной выборке', () => {
        const items: Record<string, TCartItem> = {
            'prod-1': makeProduct({ selectedForCheckout: true, price: 500000 }),
            'prod-2': makeProduct({
                product: { id: 'prod-2', name: 'Невыбранный' },
                selectedForCheckout: false,
                price: 999999,
            }),
        };

        const result = calculateSelectedTotals(items);

        expect(result.productsTotal).toBe(500000);
        expect(result.grandTotal).toBe(500000);
    });
});
