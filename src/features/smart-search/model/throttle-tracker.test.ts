import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

/**
 * Tests для throttle-tracker. Module-scope mutable state (timestamps[]
 * + subscribers Set) — для изоляции между тестами используем
 * `vi.resetModules()` + dynamic import в каждом тесте.
 *
 * Coverage:
 * - recordSearchRequest() добавляет timestamp
 * - getRemainingNow() возвращает LIMIT - count
 * - gc по WINDOW_MS — старые expired'ятся
 * - useThrottleRemaining() реагирует на recordSearchRequest (notify)
 * - useThrottleRemaining() unsubscribes на unmount
 */

describe('throttle-tracker', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.useFakeTimers({ now: 1_000_000 });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getRemainingNow', () => {
        it('возвращает LIMIT=10 когда нет записей', async () => {
            const { getRemainingNow } = await import('./throttle-tracker');
            expect(getRemainingNow()).toBe(10);
        });

        it('уменьшается на 1 после recordSearchRequest', async () => {
            const { recordSearchRequest, getRemainingNow } = await import('./throttle-tracker');
            recordSearchRequest();
            expect(getRemainingNow()).toBe(9);
            recordSearchRequest();
            recordSearchRequest();
            expect(getRemainingNow()).toBe(7);
        });

        it('clamps at 0 когда LIMIT=10 exceeded', async () => {
            const { recordSearchRequest, getRemainingNow } = await import('./throttle-tracker');
            for (let i = 0; i < 12; i += 1) recordSearchRequest();
            expect(getRemainingNow()).toBe(0);
        });
    });

    describe('rolling 60s window gc', () => {
        it('expired timestamps удаляются после 60s', async () => {
            const { recordSearchRequest, getRemainingNow } = await import('./throttle-tracker');
            recordSearchRequest();
            recordSearchRequest();
            recordSearchRequest();
            expect(getRemainingNow()).toBe(7);
            // Time advance 61s
            vi.advanceTimersByTime(61_000);
            expect(getRemainingNow()).toBe(10);
        });

        it('partial expiration — старые ушли, новые остались', async () => {
            const { recordSearchRequest, getRemainingNow } = await import('./throttle-tracker');
            recordSearchRequest();
            recordSearchRequest();
            vi.advanceTimersByTime(30_000);
            recordSearchRequest();
            // 3 within 60s → 7 remaining
            expect(getRemainingNow()).toBe(7);
            // 31s more (total 61s with first 2) — first 2 expire, third still in
            vi.advanceTimersByTime(31_000);
            expect(getRemainingNow()).toBe(9);
        });
    });

    describe('useThrottleRemaining hook', () => {
        it('возвращает текущий remaining count', async () => {
            const { useThrottleRemaining, recordSearchRequest } =
                await import('./throttle-tracker');
            recordSearchRequest();
            recordSearchRequest();
            const { result } = renderHook(() => useThrottleRemaining());
            expect(result.current).toBe(8);
        });

        it('re-renders при recordSearchRequest (subscriber notify)', async () => {
            const { useThrottleRemaining, recordSearchRequest } =
                await import('./throttle-tracker');
            const { result } = renderHook(() => useThrottleRemaining());
            expect(result.current).toBe(10);
            act(() => {
                recordSearchRequest();
            });
            expect(result.current).toBe(9);
        });

        it('unsubscribes на unmount (не лопается при последующих recordSearchRequest)', async () => {
            const { useThrottleRemaining, recordSearchRequest } =
                await import('./throttle-tracker');
            const { result, unmount } = renderHook(() => useThrottleRemaining());
            expect(result.current).toBe(10);
            unmount();
            // Не должно бросать / leak'ать
            act(() => {
                recordSearchRequest();
            });
            // result.current не обновится после unmount, но не упадёт
            expect(result.current).toBe(10);
        });
    });
});
