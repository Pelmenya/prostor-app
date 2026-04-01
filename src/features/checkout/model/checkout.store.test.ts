import { describe, it, expect, beforeEach } from 'vitest';
import { useCheckoutStore } from './checkout.store';
import type { TRetailStoreWithRouteInfo } from '@/shared/model';

beforeEach(() => {
    useCheckoutStore.setState({ selectedRealEstateId: null, selectedPickupStore: null });
});

describe('checkout.store', () => {
    describe('setSelectedRealEstateId', () => {
        it('устанавливает id объекта', () => {
            useCheckoutStore.getState().setSelectedRealEstateId(42);
            expect(useCheckoutStore.getState().selectedRealEstateId).toBe(42);
        });

        it('сбрасывает id в null', () => {
            useCheckoutStore.getState().setSelectedRealEstateId(42);
            useCheckoutStore.getState().setSelectedRealEstateId(null);
            expect(useCheckoutStore.getState().selectedRealEstateId).toBeNull();
        });
    });

    describe('setSelectedPickupStore', () => {
        const store = {
            id: 1,
            name: 'Пункт выдачи',
            address: 'ул. Пушкина',
            distance: 1000,
            organizationMoySkladId: 'org-1',
        } as unknown as TRetailStoreWithRouteInfo;

        it('устанавливает пункт самовывоза', () => {
            useCheckoutStore.getState().setSelectedPickupStore(store);
            expect(useCheckoutStore.getState().selectedPickupStore).toEqual(store);
        });

        it('сбрасывает пункт самовывоза в null', () => {
            useCheckoutStore.getState().setSelectedPickupStore(store);
            useCheckoutStore.getState().setSelectedPickupStore(null);
            expect(useCheckoutStore.getState().selectedPickupStore).toBeNull();
        });
    });
});
