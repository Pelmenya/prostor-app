import { describe, it, expect } from 'vitest';
import { toBackendCartState, fromBackendCartState } from './cart-mappers';
import { EServiceCategory } from '@/shared/model';
import type { TCartItem, TCartServiceItem } from '../model/cart.store';
import type { TBackendCartState } from '../api/cart.types';

const mockService: TCartServiceItem = {
    serviceInfo: {
        id: 'svc-1',
        name: 'Монтаж фильтра',
        rateOfHours: 2,
        category: EServiceCategory.MONTAZH,
    },
    count: 1,
    price: 300000,
    checked: true,
    selectedForCheckout: true,
};

const mockItem: TCartItem = {
    product: { id: 'prod-1', name: 'Фильтр Аквафор' },
    count: 2,
    price: 500000,
    selectedForCheckout: true,
    services: { 'svc-1': mockService },
};

const mockItems: Record<string, TCartItem> = { 'prod-1': mockItem };

describe('toBackendCartState', () => {
    it('конвертирует serviceInfo → service', () => {
        const result = toBackendCartState(mockItems);
        const svc = result.items['prod-1'].services['svc-1'];

        expect(svc.service.id).toBe('svc-1');
        expect(svc.service.name).toBe('Монтаж фильтра');
        expect(svc.service.rateOfHours).toBe(2);
        expect(svc.service.category).toBe(EServiceCategory.MONTAZH);
    });

    it('сохраняет данные товара', () => {
        const result = toBackendCartState(mockItems);
        const item = result.items['prod-1'];

        expect(item.product.id).toBe('prod-1');
        expect(item.product.name).toBe('Фильтр Аквафор');
        expect(item.count).toBe(2);
        expect(item.price).toBe(500000);
        expect(item.selectedForCheckout).toBe(true);
    });

    it('не добавляет расчётные поля (totals)', () => {
        const result = toBackendCartState(mockItems);

        expect(result.totalPrice).toBeUndefined();
        expect(result.totalProductsPrice).toBeUndefined();
        expect(result.totalServicesPrice).toBeUndefined();
        expect(result.totalRateOfHours).toBeUndefined();
    });

    it('обрабатывает пустую корзину', () => {
        const result = toBackendCartState({});
        expect(result.items).toEqual({});
    });

    it('обрабатывает товар без услуг', () => {
        const items: Record<string, TCartItem> = {
            'prod-2': {
                product: { id: 'prod-2', name: 'Картридж' },
                count: 3,
                price: 100000,
                selectedForCheckout: false,
                services: {},
            },
        };

        const result = toBackendCartState(items);
        expect(result.items['prod-2'].services).toEqual({});
        expect(result.items['prod-2'].selectedForCheckout).toBe(false);
    });
});

describe('fromBackendCartState', () => {
    const backendState: TBackendCartState = {
        id: 'cart-uuid',
        items: {
            'prod-1': {
                product: { id: 'prod-1', name: 'Фильтр Аквафор' },
                count: 2,
                price: 500000,
                selectedForCheckout: true,
                services: {
                    'svc-1': {
                        service: {
                            id: 'svc-1',
                            name: 'Монтаж фильтра',
                            rateOfHours: 2,
                            category: 'Монтаж',
                        },
                        count: 1,
                        price: 300000,
                        checked: true,
                        selectedForCheckout: true,
                    },
                },
            },
        },
        totalPrice: 1300000,
        totalProductsPrice: 1000000,
        totalServicesPrice: 300000,
        totalRateOfHours: 2,
    };

    it('конвертирует service → serviceInfo', () => {
        const result = fromBackendCartState(backendState);
        const svc = result['prod-1'].services['svc-1'];

        expect(svc.serviceInfo.id).toBe('svc-1');
        expect(svc.serviceInfo.name).toBe('Монтаж фильтра');
        expect(svc.serviceInfo.rateOfHours).toBe(2);
        expect(svc.serviceInfo.category).toBe(EServiceCategory.MONTAZH);
    });

    it('сохраняет данные товара', () => {
        const result = fromBackendCartState(backendState);
        const item = result['prod-1'];

        expect(item.product.id).toBe('prod-1');
        expect(item.count).toBe(2);
        expect(item.price).toBe(500000);
        expect(item.selectedForCheckout).toBe(true);
    });

    it('selectedForCheckout по умолчанию true', () => {
        const state: TBackendCartState = {
            items: {
                'prod-1': {
                    product: { id: 'prod-1', name: 'Товар' },
                    count: 1,
                    price: 100,
                    services: {
                        'svc-1': {
                            service: { id: 'svc-1', name: 'Услуга' },
                            count: 1,
                            price: 50,
                            checked: true,
                        },
                    },
                },
            },
        };

        const result = fromBackendCartState(state);
        expect(result['prod-1'].selectedForCheckout).toBe(true);
        expect(result['prod-1'].services['svc-1'].selectedForCheckout).toBe(true);
    });

    it('обрабатывает null/undefined items', () => {
        expect(fromBackendCartState({ items: {} })).toEqual({});
        expect(fromBackendCartState(null as unknown as TBackendCartState)).toEqual({});
        expect(fromBackendCartState(undefined as unknown as TBackendCartState)).toEqual({});
    });

    it('обрабатывает товар без услуг', () => {
        const state: TBackendCartState = {
            items: {
                'prod-1': {
                    product: { id: 'prod-1', name: 'Товар' },
                    count: 1,
                    price: 100,
                    services: {},
                },
            },
        };

        const result = fromBackendCartState(state);
        expect(result['prod-1'].services).toEqual({});
    });
});

describe('round-trip: toBackend → fromBackend', () => {
    it('данные сохраняются при конвертации туда-обратно', () => {
        const backend = toBackendCartState(mockItems);
        const restored = fromBackendCartState(backend);

        expect(restored['prod-1'].product).toEqual(mockItem.product);
        expect(restored['prod-1'].count).toBe(mockItem.count);
        expect(restored['prod-1'].price).toBe(mockItem.price);
        expect(restored['prod-1'].selectedForCheckout).toBe(mockItem.selectedForCheckout);

        const restoredSvc = restored['prod-1'].services['svc-1'];
        expect(restoredSvc.serviceInfo.id).toBe(mockService.serviceInfo.id);
        expect(restoredSvc.serviceInfo.name).toBe(mockService.serviceInfo.name);
        expect(restoredSvc.serviceInfo.rateOfHours).toBe(mockService.serviceInfo.rateOfHours);
        expect(restoredSvc.serviceInfo.category).toBe(mockService.serviceInfo.category);
        expect(restoredSvc.count).toBe(mockService.count);
        expect(restoredSvc.price).toBe(mockService.price);
        expect(restoredSvc.checked).toBe(mockService.checked);
    });
});
