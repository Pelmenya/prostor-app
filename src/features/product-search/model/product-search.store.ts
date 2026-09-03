import { create } from 'zustand';

type TProductSearchStore = {
    isOpen: boolean;
    hasEverOpened: boolean;
    open: () => void;
    close: () => void;
};

export const useProductSearchStore = create<TProductSearchStore>((set) => ({
    isOpen: false,
    hasEverOpened: false,
    open: () => set({ isOpen: true, hasEverOpened: true }),
    close: () => set({ isOpen: false }),
}));
