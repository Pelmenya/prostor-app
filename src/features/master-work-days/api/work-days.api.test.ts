import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, Suspense, type ReactNode } from 'react';
import { workDayKeys, useGetOrdersByDate } from './work-days.api';
import { ApiError } from '@/shared/api';

const mockApi = vi.fn();

vi.mock('@/shared/api', async (importActual) => {
    const actual = await importActual<typeof import('@/shared/api')>();
    return { ...actual, useApi: () => mockApi };
});

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return {
        queryClient,
        wrapper: ({ children }: { children: ReactNode }) =>
            createElement(
                QueryClientProvider,
                { client: queryClient },
                createElement(Suspense, { fallback: null }, children),
            ),
    };
}

describe('workDayKeys', () => {
    it('orders() включает дату в ключ', () => {
        expect(workDayKeys.orders('2026-05-01')).toEqual([
            'schedule',
            'work-day',
            '2026-05-01',
            'orders',
        ]);
    });

    it('route() включает дату в ключ', () => {
        expect(workDayKeys.route('2026-05-01')).toEqual([
            'schedule',
            'work-day',
            '2026-05-01',
            'route',
        ]);
    });
});

describe('useGetOrdersByDate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('загружает заказы на дату', async () => {
        const mockOrders = [{ id: 1 }, { id: 2 }];
        mockApi.mockResolvedValueOnce(mockOrders);

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useGetOrdersByDate('2026-05-01'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockOrders);
        expect(mockApi).toHaveBeenCalledWith('/service/work-day/2026-05-01');
    });

    it('возвращает пустой массив если API вернул null', async () => {
        mockApi.mockResolvedValueOnce(null);

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useGetOrdersByDate('2026-05-01'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([]);
    });

    it('возвращает пустой массив при 404 (день не найден)', async () => {
        mockApi.mockRejectedValueOnce(new ApiError(404, 'Not Found', null));

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useGetOrdersByDate('2026-12-31'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([]);
    });

    it('пробрасывает ошибку при статусах != 404', async () => {
        mockApi.mockRejectedValueOnce(new ApiError(500, 'Server Error', null));

        const { wrapper, queryClient } = createWrapper();
        renderHook(() => useGetOrdersByDate('2026-05-01'), { wrapper });

        await waitFor(() => {
            const state = queryClient.getQueryState(workDayKeys.orders('2026-05-01'));
            expect(state?.error).toBeInstanceOf(Error);
        });
    });
});
