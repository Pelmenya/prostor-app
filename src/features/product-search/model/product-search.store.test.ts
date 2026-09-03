import { describe, it, expect, beforeEach } from 'vitest';
import { useProductSearchStore } from './product-search.store';

describe('useProductSearchStore', () => {
    beforeEach(() => {
        useProductSearchStore.setState({ isOpen: false, hasEverOpened: false });
    });

    it('начальное состояние: isOpen=false, hasEverOpened=false', () => {
        const state = useProductSearchStore.getState();
        expect(state.isOpen).toBe(false);
        expect(state.hasEverOpened).toBe(false);
    });

    it('open() устанавливает isOpen=true и hasEverOpened=true', () => {
        useProductSearchStore.getState().open();
        const state = useProductSearchStore.getState();
        expect(state.isOpen).toBe(true);
        expect(state.hasEverOpened).toBe(true);
    });

    it('close() устанавливает isOpen=false, hasEverOpened остаётся true', () => {
        useProductSearchStore.getState().open();
        useProductSearchStore.getState().close();
        const state = useProductSearchStore.getState();
        expect(state.isOpen).toBe(false);
        expect(state.hasEverOpened).toBe(true);
    });

    it('open() идемпотентен', () => {
        useProductSearchStore.getState().open();
        useProductSearchStore.getState().open();
        expect(useProductSearchStore.getState().isOpen).toBe(true);
    });

    it('close() идемпотентен', () => {
        useProductSearchStore.getState().close();
        expect(useProductSearchStore.getState().isOpen).toBe(false);
    });
});
