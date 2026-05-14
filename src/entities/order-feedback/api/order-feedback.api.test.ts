import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, Suspense, type ReactNode } from 'react';
import {
    orderFeedbackKeys,
    useGetMyOrderFeedback,
    useGetExecutorAverageRating,
    useGetExecutorDetailedRating,
} from './order-feedback.api';

const mockApi = vi.fn();

vi.mock('@/shared/api', () => ({
    useApi: () => mockApi,
}));

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

const MOCK_FEEDBACK = {
    id: 'feedback-1',
    orderId: 42,
    executorId: 7,
    clientParameters: { cleanliness: 5, professionalism: 4, punctuality: 5 },
    comment: 'Отличная работа',
    createdAt: '2026-01-01T00:00:00Z',
};

describe('order-feedback API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('orderFeedbackKeys', () => {
        it('myFeedback — включает orderId', () => {
            expect(orderFeedbackKeys.myFeedback(42)).toEqual(['order-feedback', 'my', 42]);
        });
    });

    describe('useGetMyOrderFeedback', () => {
        it('запрашивает GET /order-feedback/order/:id/my', async () => {
            mockApi.mockResolvedValue(MOCK_FEEDBACK);
            const { wrapper } = createWrapper();

            const { result } = renderHook(() => useGetMyOrderFeedback(42), { wrapper });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(mockApi).toHaveBeenCalledWith('/order-feedback/order/42/my');
        });

        it('Suspense-контракт: data никогда не undefined после загрузки', async () => {
            mockApi.mockResolvedValue(MOCK_FEEDBACK);
            const { wrapper } = createWrapper();
            const { result } = renderHook(() => useGetMyOrderFeedback(42), { wrapper });
            await waitFor(() => expect(result.current.data).toBeDefined());
            // useSuspenseQuery гарантирует data определена (не undefined)
            expect(result.current.data).not.toBeUndefined();
        });

        it('Suspense-контракт: возвращает null когда отзыва нет', async () => {
            mockApi.mockResolvedValue(null);
            const { wrapper } = createWrapper();
            const { result } = renderHook(() => useGetMyOrderFeedback(42), { wrapper });
            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toBeNull();
        });

        it('Suspense-контракт: ставит ошибку в query state при неудачном запросе', async () => {
            mockApi.mockRejectedValue(new Error('Unauthorized'));
            const { wrapper, queryClient } = createWrapper();
            renderHook(() => useGetMyOrderFeedback(42), { wrapper });
            // useSuspenseQuery выбрасывает — проверяем через queryClient state
            await waitFor(() => {
                const state = queryClient.getQueryState(orderFeedbackKeys.myFeedback(42));
                expect(state?.error).toBeInstanceOf(Error);
            });
        });
    });

    describe('useGetExecutorAverageRating', () => {
        it('загружает средний рейтинг исполнителя', async () => {
            const mockRating = { average: 4.5, count: 10 };
            mockApi.mockResolvedValueOnce(mockRating);

            const { wrapper } = createWrapper();
            const { result } = renderHook(() => useGetExecutorAverageRating(7), { wrapper });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toEqual(mockRating);
            expect(mockApi).toHaveBeenCalledWith('/order-feedback/executor/7/average');
        });

        it('не делает запрос если userId не передан', () => {
            const { wrapper } = createWrapper();
            renderHook(() => useGetExecutorAverageRating(undefined), { wrapper });
            expect(mockApi).not.toHaveBeenCalled();
        });
    });

    describe('useGetExecutorDetailedRating', () => {
        it('загружает детальный рейтинг исполнителя', async () => {
            const mockDetailed = {
                average: 4.5,
                count: 10,
                parameters: { cleanliness: 4.8, professionalism: 4.3 },
            };
            mockApi.mockResolvedValueOnce(mockDetailed);

            const { wrapper } = createWrapper();
            const { result } = renderHook(() => useGetExecutorDetailedRating(7), { wrapper });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toEqual(mockDetailed);
            expect(mockApi).toHaveBeenCalledWith('/order-feedback/executor/7/detailed');
        });
    });
});
