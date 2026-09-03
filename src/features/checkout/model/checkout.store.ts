import { create } from 'zustand';
import type { TRetailStoreWithRouteInfo } from '@/shared/model';

type TCheckoutStore = {
    selectedRealEstateId: number | null;
    setSelectedRealEstateId: (id: number | null) => void;
    selectedPickupStore: TRetailStoreWithRouteInfo | null;
    setSelectedPickupStore: (store: TRetailStoreWithRouteInfo | null) => void;
};

export const useCheckoutStore = create<TCheckoutStore>((set) => ({
    selectedRealEstateId: null,
    setSelectedRealEstateId: (id) => set({ selectedRealEstateId: id }),
    selectedPickupStore: null,
    setSelectedPickupStore: (store) => set({ selectedPickupStore: store }),
}));
