import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue } from './use-debounced-value';

describe('useDebouncedValue', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('возвращает начальное значение без задержки', () => {
        const { result } = renderHook(() => useDebouncedValue('initial'));
        expect(result.current).toBe('initial');
    });

    it('не обновляет значение до истечения delay', () => {
        const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
            initialProps: { v: 'a' },
        });

        rerender({ v: 'b' });
        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(result.current).toBe('a');
    });

    it('обновляет значение после истечения delay', () => {
        const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
            initialProps: { v: 'a' },
        });

        rerender({ v: 'b' });
        act(() => {
            vi.advanceTimersByTime(300);
        });
        expect(result.current).toBe('b');
    });

    it('сбрасывает таймер при быстром изменении значения', () => {
        const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
            initialProps: { v: 'a' },
        });

        rerender({ v: 'b' });
        act(() => {
            vi.advanceTimersByTime(150);
        });
        rerender({ v: 'c' });
        act(() => {
            vi.advanceTimersByTime(150);
        });
        expect(result.current).toBe('a');

        act(() => {
            vi.advanceTimersByTime(150);
        });
        expect(result.current).toBe('c');
    });

    it('не триммит пробелы (trim — ответственность caller)', () => {
        const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
            initialProps: { v: 'a' },
        });

        rerender({ v: '  пробелы  ' });
        act(() => {
            vi.advanceTimersByTime(300);
        });
        expect(result.current).toBe('  пробелы  ');
    });
});
