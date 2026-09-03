import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearchState } from './use-search-state';
import { useProductSearchStore } from '../../model/product-search.store';

describe('useSearchState', () => {
    beforeEach(() => {
        useProductSearchStore.setState({ isOpen: true });
        vi.useFakeTimers();
    });
    afterEach(() => vi.useRealTimers());

    it('начальное состояние: innerQuery пустой, query пустой', () => {
        const { result } = renderHook(() => useSearchState());
        expect(result.current.innerQuery).toBe('');
        expect(result.current.query).toBe('');
    });

    it('setInnerQuery обновляет innerQuery немедленно', () => {
        const { result } = renderHook(() => useSearchState());
        act(() => {
            result.current.setInnerQuery('фильтр');
        });
        expect(result.current.innerQuery).toBe('фильтр');
    });

    it('query обновляется после debounce 300ms', () => {
        const { result } = renderHook(() => useSearchState());
        act(() => {
            result.current.setInnerQuery('фильтр');
        });
        expect(result.current.query).toBe('');
        act(() => {
            vi.advanceTimersByTime(300);
        });
        expect(result.current.query).toBe('фильтр');
    });

    it('query триммит пробелы', () => {
        const { result } = renderHook(() => useSearchState());
        act(() => {
            result.current.setInnerQuery('  фильтр  ');
        });
        act(() => {
            vi.advanceTimersByTime(300);
        });
        expect(result.current.query).toBe('фильтр');
    });

    it('handleClose сбрасывает innerQuery и закрывает стор', () => {
        const { result } = renderHook(() => useSearchState());
        act(() => {
            result.current.setInnerQuery('запрос');
        });
        act(() => {
            result.current.handleClose();
        });
        expect(result.current.innerQuery).toBe('');
        expect(useProductSearchStore.getState().isOpen).toBe(false);
    });

    it('handleClear сбрасывает только innerQuery', () => {
        const { result } = renderHook(() => useSearchState());
        act(() => {
            result.current.setInnerQuery('запрос');
        });
        act(() => {
            result.current.handleClear();
        });
        expect(result.current.innerQuery).toBe('');
        expect(useProductSearchStore.getState().isOpen).toBe(true);
    });
});
