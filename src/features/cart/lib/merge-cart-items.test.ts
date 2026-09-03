import { describe, it, expect } from 'vitest';
import { mergeCartItems } from './merge-cart-items';
import type { TCartItem, TCartServiceItem } from '@/entities/cart';
import { EServiceCategory } from '@/shared/model';

const makeItem = (
    overrides: Partial<TCartItem> & { product: TCartItem['product'] },
): TCartItem => ({
    count: 1,
    price: 100000,
    selectedForCheckout: true,
    services: {},
    ...overrides,
});

const makeService = (overrides: Partial<TCartServiceItem> = {}): TCartServiceItem => ({
    serviceInfo: {
        id: 'svc-1',
        name: 'Монтаж',
        rateOfHours: 2,
        category: EServiceCategory.MONTAZH,
    },
    count: 1,
    price: 50000,
    checked: true,
    selectedForCheckout: true,
    ...overrides,
});

describe('mergeCartItems', () => {
    it('товар только в local → добавляется', () => {
        const local = { p1: makeItem({ product: { id: 'p1', name: 'Локальный' }, count: 2 }) };
        const server = {};

        const result = mergeCartItems(local, server);
        expect(result['p1'].count).toBe(2);
        expect(result['p1'].product.name).toBe('Локальный');
    });

    it('товар только на сервере → остаётся', () => {
        const local = {};
        const server = { p1: makeItem({ product: { id: 'p1', name: 'Серверный' }, count: 3 }) };

        const result = mergeCartItems(local, server);
        expect(result['p1'].count).toBe(3);
        expect(result['p1'].product.name).toBe('Серверный');
    });

    it('товар в обоих → max(count), цена с сервера', () => {
        const local = {
            p1: makeItem({ product: { id: 'p1', name: 'Фильтр' }, count: 5, price: 100 }),
        };
        const server = {
            p1: makeItem({
                product: { id: 'p1', name: 'Фильтр обновлённый' },
                count: 2,
                price: 200,
            }),
        };

        const result = mergeCartItems(local, server);
        expect(result['p1'].count).toBe(5); // max(5, 2)
        expect(result['p1'].price).toBe(200); // цена с сервера
        expect(result['p1'].product.name).toBe('Фильтр обновлённый'); // инфо с сервера
    });

    it('selectedForCheckout берётся с сервера', () => {
        const local = {
            p1: makeItem({ product: { id: 'p1', name: 'A' }, selectedForCheckout: true }),
        };
        const server = {
            p1: makeItem({ product: { id: 'p1', name: 'A' }, selectedForCheckout: false }),
        };

        const result = mergeCartItems(local, server);
        expect(result['p1'].selectedForCheckout).toBe(false);
    });

    it('услуга только в local → добавляется', () => {
        const svc = makeService();
        const local = {
            p1: makeItem({ product: { id: 'p1', name: 'A' }, services: { 'svc-1': svc } }),
        };
        const server = {
            p1: makeItem({ product: { id: 'p1', name: 'A' }, services: {} }),
        };

        const result = mergeCartItems(local, server);
        expect(result['p1'].services['svc-1'].count).toBe(1);
    });

    it('услуга только на сервере → остаётся', () => {
        const svc = makeService({ count: 3 });
        const local = {
            p1: makeItem({ product: { id: 'p1', name: 'A' }, services: {} }),
        };
        const server = {
            p1: makeItem({ product: { id: 'p1', name: 'A' }, services: { 'svc-1': svc } }),
        };

        const result = mergeCartItems(local, server);
        expect(result['p1'].services['svc-1'].count).toBe(3);
    });

    it('услуга в обоих → max(count), цена с сервера', () => {
        const localSvc = makeService({ count: 4, price: 100 });
        const serverSvc = makeService({ count: 2, price: 200 });
        const local = {
            p1: makeItem({ product: { id: 'p1', name: 'A' }, services: { 'svc-1': localSvc } }),
        };
        const server = {
            p1: makeItem({ product: { id: 'p1', name: 'A' }, services: { 'svc-1': serverSvc } }),
        };

        const result = mergeCartItems(local, server);
        expect(result['p1'].services['svc-1'].count).toBe(4); // max(4, 2)
        expect(result['p1'].services['svc-1'].price).toBe(200); // цена с сервера
        expect(result['p1'].services['svc-1'].checked).toBe(true); // count > 0
    });

    it('пустые корзины → пустой результат', () => {
        expect(mergeCartItems({}, {})).toEqual({});
    });

    it('несколько товаров из разных источников', () => {
        const local = {
            p1: makeItem({ product: { id: 'p1', name: 'Local' }, count: 1 }),
            p2: makeItem({ product: { id: 'p2', name: 'Both' }, count: 3 }),
        };
        const server = {
            p2: makeItem({ product: { id: 'p2', name: 'Both' }, count: 5 }),
            p3: makeItem({ product: { id: 'p3', name: 'Server' }, count: 2 }),
        };

        const result = mergeCartItems(local, server);
        expect(Object.keys(result).sort()).toEqual(['p1', 'p2', 'p3']);
        expect(result['p1'].count).toBe(1);
        expect(result['p2'].count).toBe(5); // max(3, 5)
        expect(result['p3'].count).toBe(2);
    });

    it('merged service checked = false когда оба count = 0', () => {
        const localSvc = makeService({ count: 0, checked: false });
        const serverSvc = makeService({ count: 0, checked: false });
        const local = {
            p1: makeItem({ product: { id: 'p1', name: 'A' }, services: { 'svc-1': localSvc } }),
        };
        const server = {
            p1: makeItem({ product: { id: 'p1', name: 'A' }, services: { 'svc-1': serverSvc } }),
        };

        const result = mergeCartItems(local, server);
        expect(result['p1'].services['svc-1'].checked).toBe(false); // max(0, 0) = 0
    });
});
