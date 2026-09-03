import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, Suspense, type ReactNode } from 'react';
import {
    orderKeys,
    useGetOrders,
    useGetOrdersCount,
    useGetOrderById,
    useCreateOrder,
    useUpdateOrderStatus,
} from './order.api';
import { EOrderStatus } from '../model/types/e-order-status';
import { EDeliveryType } from '../model/types/e-delivery-type';

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

const MOCK_ORDER = {
    id: 1,
    status: EOrderStatus.PENDING,
    cartState: { items: {} },
    paymentStatus: 'pending',
    totalAmount: 0,
    currency: 'RUB',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
};

const MOCK_PAGINATED_RESPONSE = {
    items: [MOCK_ORDER],
    nextCursor: 'cursor-abc',
    hasMore: true,
};

describe('order API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('orderKeys', () => {
        it('all -- корректный ключ', () => {
            expect(orderKeys.all).toEqual(['orders']);
        });

        it('list -- включает параметры', () => {
            const params = { limit: 10, status: [EOrderStatus.PENDING] };
            expect(orderKeys.list(params)).toEqual(['orders', 'list', params]);
        });

        it('count -- включает параметры', () => {
            const params = { status: [EOrderStatus.COMPLETED] };
            expect(orderKeys.count(params)).toEqual(['orders', 'count', params]);
        });

        it('detail -- включает id', () => {
            expect(orderKeys.detail(42)).toEqual(['orders', 'detail', 42]);
        });
    });

    describe('useGetOrders', () => {
        it('запрашивает GET /order/all/filters с query-params', async () => {
            mockApi.mockResolvedValue(MOCK_PAGINATED_RESPONSE);
            const { wrapper } = createWrapper();

            const params = { limit: 10, status: [EOrderStatus.PENDING, EOrderStatus.CONFIRMED] };
            const { result } = renderHook(() => useGetOrders(params), { wrapper });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            const calledUrl = mockApi.mock.calls[0][0] as string;
            expect(calledUrl).toContain('/order/all/filters?');
            expect(calledUrl).toContain('limit=10');
            expect(calledUrl).toContain('status=pending');
            expect(calledUrl).toContain('status=confirmed');
        });

        it('возвращает данные из первой страницы', async () => {
            mockApi.mockResolvedValue(MOCK_PAGINATED_RESPONSE);
            const { wrapper } = createWrapper();

            const { result } = renderHook(() => useGetOrders({ limit: 10 }), { wrapper });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data?.pages[0]).toEqual(MOCK_PAGINATED_RESPONSE);
        });
    });

    describe('useGetOrdersCount', () => {
        it('запрашивает GET /order/count с query-params', async () => {
            mockApi.mockResolvedValue({ count: 5 });
            const { wrapper } = createWrapper();

            const params = { status: [EOrderStatus.COMPLETED] };
            const { result } = renderHook(() => useGetOrdersCount(params), { wrapper });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            const calledUrl = mockApi.mock.calls[0][0] as string;
            expect(calledUrl).toContain('/order/count?');
            expect(calledUrl).toContain('status=completed');
            expect(result.current.data).toEqual({ count: 5 });
        });
    });

    describe('useGetOrderById', () => {
        it('запрашивает GET /order/:id', async () => {
            mockApi.mockResolvedValue(MOCK_ORDER);
            const { wrapper } = createWrapper();

            const { result } = renderHook(() => useGetOrderById(1), { wrapper });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(mockApi).toHaveBeenCalledWith('/order/1');
        });
    });

    describe('useCreateOrder', () => {
        it('POST /order с body', async () => {
            mockApi.mockResolvedValue(MOCK_ORDER);
            const { wrapper } = createWrapper();

            const { result } = renderHook(() => useCreateOrder(), { wrapper });

            const body = {
                clientId: 100,
                realEstateId: 10,
                cartId: 'cart-1',
                deliveryType: EDeliveryType.PICKUP,
            };

            result.current.mutate(body);

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(mockApi).toHaveBeenCalledWith('/order', {
                method: 'POST',
                body,
            });
        });
    });

    describe('Suspense-контракт', () => {
        it('useGetOrderById.data никогда не undefined после загрузки', async () => {
            mockApi.mockResolvedValue(MOCK_ORDER);
            const { wrapper } = createWrapper();
            const { result } = renderHook(() => useGetOrderById(1), { wrapper });
            await waitFor(() => expect(result.current.data).toBeDefined());
            expect(result.current.data.id).toBe(1);
        });

        it('useGetOrderById ставит ошибку в query state при неудачном запросе', async () => {
            const error = new Error('Network error');
            mockApi.mockRejectedValue(error);
            const { wrapper, queryClient } = createWrapper();
            renderHook(() => useGetOrderById(1), { wrapper });
            // useSuspenseQuery выбрасывает — проверяем через queryClient state
            await waitFor(() => {
                const state = queryClient.getQueryState(orderKeys.detail(1));
                expect(state?.error).toBeInstanceOf(Error);
            });
        });

        it('useGetOrders.data никогда не undefined после загрузки', async () => {
            mockApi.mockResolvedValue(MOCK_PAGINATED_RESPONSE);
            const { wrapper } = createWrapper();
            const { result } = renderHook(() => useGetOrders({ limit: 10 }), { wrapper });
            await waitFor(() => expect(result.current.data).toBeDefined());
            expect(result.current.data.pages).toHaveLength(1);
        });

        it('fetchNextPage не обнуляет данные первой страницы — Suspense не срабатывает повторно', async () => {
            const secondPage = { items: [MOCK_ORDER], nextCursor: null, hasMore: false };
            mockApi
                .mockResolvedValueOnce(MOCK_PAGINATED_RESPONSE)
                .mockResolvedValueOnce(secondPage);

            const { wrapper } = createWrapper();
            const { result } = renderHook(() => useGetOrders({ limit: 10 }), { wrapper });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data.pages).toHaveLength(1);

            result.current.fetchNextPage();

            // Ожидаем вторую страницу — data первой страницы должна сохраниться
            await waitFor(() => expect(result.current.data.pages).toHaveLength(2));
            expect(result.current.data.pages[0]).toEqual(MOCK_PAGINATED_RESPONSE);
        });
    });

    describe('useUpdateOrderStatus', () => {
        it('PATCH /order/:id/status, обновляет detail через setQueryData и инвалидирует all', async () => {
            const updatedOrder = { ...MOCK_ORDER, status: EOrderStatus.CONFIRMED };
            mockApi.mockResolvedValue(updatedOrder);
            const { wrapper, queryClient } = createWrapper();
            const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            const { result } = renderHook(() => useUpdateOrderStatus(), { wrapper });

            result.current.mutate({ orderId: 1, status: EOrderStatus.CONFIRMED });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(mockApi).toHaveBeenCalledWith('/order/1/status', {
                method: 'PATCH',
                body: { status: EOrderStatus.CONFIRMED },
            });
            expect(setQueryDataSpy).toHaveBeenCalledWith(orderKeys.detail(1), updatedOrder);
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: orderKeys.all });
        });
    });
});
