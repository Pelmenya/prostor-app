import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { UseFormWatch } from 'react-hook-form';
import { getFormDraft, useFormDraft } from './use-form-draft';

// ---- getFormDraft ----

describe('getFormDraft', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('возвращает null при отсутствии записи', () => {
        expect(getFormDraft('no-key')).toBeNull();
    });

    it('возвращает распарсенный объект при наличии записи', () => {
        sessionStorage.setItem('test-key', JSON.stringify({ email: 'a@b.com' }));
        expect(getFormDraft('test-key')).toEqual({ email: 'a@b.com' });
    });

    it('возвращает null при невалидном JSON', () => {
        sessionStorage.setItem('bad-key', 'not{{json');
        expect(getFormDraft('bad-key')).toBeNull();
    });
});

// ---- useFormDraft ----

type TTestForm = { email: string; password: string; name: string };

function createWatchMock() {
    let cb: ((values: Partial<TTestForm>) => void) | null = null;
    const unsubscribe = vi.fn();
    const watchFn = vi.fn((callback: (values: Partial<TTestForm>) => void) => {
        cb = callback;
        return { unsubscribe };
    });
    const watch = watchFn as unknown as UseFormWatch<TTestForm>;
    const trigger = (values: Partial<TTestForm>) =>
        act(() => {
            cb?.(values);
        });
    return { watch, trigger, unsubscribe };
}

describe('useFormDraft', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('сохраняет значения в sessionStorage при изменении формы', () => {
        const { watch, trigger } = createWatchMock();
        renderHook(() => useFormDraft<TTestForm>('draft-key', watch));

        trigger({ email: 'test@test.com', name: 'Иван' });

        expect(sessionStorage.getItem('draft-key')).toBe(
            JSON.stringify({ email: 'test@test.com', name: 'Иван' }),
        );
    });

    it('не сохраняет поля из exclude (пароль)', () => {
        const { watch, trigger } = createWatchMock();
        renderHook(() => useFormDraft<TTestForm>('draft-key', watch, { exclude: ['password'] }));

        trigger({ email: 'test@test.com', password: 'secret', name: 'Иван' });

        const saved = JSON.parse(sessionStorage.getItem('draft-key')!);
        expect(saved).not.toHaveProperty('password');
        expect(saved).toMatchObject({ email: 'test@test.com', name: 'Иван' });
    });

    it('clearDraft удаляет черновик из sessionStorage', () => {
        sessionStorage.setItem('draft-key', JSON.stringify({ email: 'x@x.com' }));
        const { watch } = createWatchMock();
        const { result } = renderHook(() => useFormDraft<TTestForm>('draft-key', watch));

        act(() => {
            result.current.clearDraft();
        });

        expect(sessionStorage.getItem('draft-key')).toBeNull();
    });

    it('отписывается при размонтировании', () => {
        const { watch, unsubscribe } = createWatchMock();
        const { unmount } = renderHook(() => useFormDraft<TTestForm>('draft-key', watch));

        unmount();

        expect(unsubscribe).toHaveBeenCalledOnce();
    });

    it('тихо игнорирует QuotaExceededError при записи в sessionStorage', () => {
        const { watch, trigger } = createWatchMock();
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('QuotaExceededError');
        });

        renderHook(() => useFormDraft<TTestForm>('draft-key', watch));

        expect(() => trigger({ email: 'a@b.com' })).not.toThrow();

        vi.restoreAllMocks();
    });
});
