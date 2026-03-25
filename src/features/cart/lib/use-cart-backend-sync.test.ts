import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { hasCartDiff, flushCartSync } from './use-cart-backend-sync';
import { useCartStore } from '@/entities/cart';
import type { TCartItem, TCartServiceItem } from '@/entities/cart';
import { EServiceCategory } from '@/shared/model';

// ── Фабрики ──

const makeSvc = (overrides: Partial<TCartServiceItem> = {}): TCartServiceItem => ({
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

const makeItem = (
    overrides: Partial<TCartItem> & { product: TCartItem['product'] },
): TCartItem => ({
    count: 1,
    price: 100000,
    selectedForCheckout: true,
    services: {},
    ...overrides,
});

// ── hasCartDiff ──

describe('hasCartDiff', () => {
    it('одинаковые корзины → false', () => {
        const a = { p1: makeItem({ product: { id: 'p1', name: 'A' }, count: 2, price: 100 }) };
        const b = { p1: makeItem({ product: { id: 'p1', name: 'A' }, count: 2, price: 100 }) };
        expect(hasCartDiff(a, b)).toBe(false);
    });

    it('разное количество товаров → true', () => {
        const a = { p1: makeItem({ product: { id: 'p1', name: 'A' } }) };
        const b = {
            p1: makeItem({ product: { id: 'p1', name: 'A' } }),
            p2: makeItem({ product: { id: 'p2', name: 'B' } }),
        };
        expect(hasCartDiff(a, b)).toBe(true);
    });

    it('разный count товара → true', () => {
        const a = { p1: makeItem({ product: { id: 'p1', name: 'A' }, count: 1 }) };
        const b = { p1: makeItem({ product: { id: 'p1', name: 'A' }, count: 3 }) };
        expect(hasCartDiff(a, b)).toBe(true);
    });

    it('разная цена товара → true', () => {
        const a = { p1: makeItem({ product: { id: 'p1', name: 'A' }, price: 100 }) };
        const b = { p1: makeItem({ product: { id: 'p1', name: 'A' }, price: 200 }) };
        expect(hasCartDiff(a, b)).toBe(true);
    });

    it('товар есть в server, нет в local → true', () => {
        const a = {};
        const b = { p1: makeItem({ product: { id: 'p1', name: 'A' } }) };
        expect(hasCartDiff(a, b)).toBe(true);
    });

    it('товар есть в local, нет в server → true', () => {
        const a = { p1: makeItem({ product: { id: 'p1', name: 'A' } }) };
        const b = {};
        expect(hasCartDiff(a, b)).toBe(true);
    });

    it('пустые корзины → false', () => {
        expect(hasCartDiff({}, {})).toBe(false);
    });

    // ── Services ──

    it('разное количество услуг → true', () => {
        const svc1 = makeSvc();
        const a = {
            p1: makeItem({ product: { id: 'p1', name: 'A' }, services: { 'svc-1': svc1 } }),
        };
        const b = {
            p1: makeItem({ product: { id: 'p1', name: 'A' }, services: {} }),
        };
        expect(hasCartDiff(a, b)).toBe(true);
    });

    it('разный count услуги → true', () => {
        const a = {
            p1: makeItem({
                product: { id: 'p1', name: 'A' },
                services: { 'svc-1': makeSvc({ count: 1 }) },
            }),
        };
        const b = {
            p1: makeItem({
                product: { id: 'p1', name: 'A' },
                services: { 'svc-1': makeSvc({ count: 3 }) },
            }),
        };
        expect(hasCartDiff(a, b)).toBe(true);
    });

    it('разная цена услуги → true', () => {
        const a = {
            p1: makeItem({
                product: { id: 'p1', name: 'A' },
                services: { 'svc-1': makeSvc({ price: 100 }) },
            }),
        };
        const b = {
            p1: makeItem({
                product: { id: 'p1', name: 'A' },
                services: { 'svc-1': makeSvc({ price: 200 }) },
            }),
        };
        expect(hasCartDiff(a, b)).toBe(true);
    });

    it('услуга есть в server, нет в local → true', () => {
        const a = {
            p1: makeItem({ product: { id: 'p1', name: 'A' }, services: {} }),
        };
        const b = {
            p1: makeItem({
                product: { id: 'p1', name: 'A' },
                services: { 'svc-1': makeSvc() },
            }),
        };
        expect(hasCartDiff(a, b)).toBe(true);
    });

    it('одинаковые товары с одинаковыми услугами → false', () => {
        const svc = makeSvc({ count: 2, price: 300 });
        const a = {
            p1: makeItem({
                product: { id: 'p1', name: 'A' },
                count: 1,
                price: 500,
                services: { 'svc-1': svc },
            }),
        };
        const b = {
            p1: makeItem({
                product: { id: 'p1', name: 'A' },
                count: 1,
                price: 500,
                services: { 'svc-1': { ...svc } },
            }),
        };
        expect(hasCartDiff(a, b)).toBe(false);
    });
});

// ── flushCartSync ──

describe('flushCartSync', () => {
    beforeEach(() => {
        useCartStore.setState({ items: {}, isGuest: true });
        vi.spyOn(globalThis, 'clearTimeout');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('возвращает undefined если нет pending таймера', () => {
        expect(flushCartSync()).toBeUndefined();
    });

    it('возвращает undefined если pendingAuth пуст', () => {
        // Нет pending таймера и auth — ничего не отправляем
        expect(flushCartSync()).toBeUndefined();
    });
});
