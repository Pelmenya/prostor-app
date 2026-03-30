import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useCreateCheckoutSession, useCancelCheckoutSession } from './checkout.api';
import type { TCreateCheckoutSession } from '@/shared/model';

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
            createElement(QueryClientProvider, { client: queryClient }, children),
    };
}

const MOCK_SESSION_RESPONSE = {
    sessionId: 'sess_123',
    invoiceLink: 'https://yookassa.ru/checkout/payments/abc',
    totalAmount: 15000,
    expiresAt: '2026-03-30T12:00:00Z',
};

const MOCK_CREATE_PAYLOAD: TCreateCheckoutSession = {
    email: 'test@example.com',
    realEstateId: 1,
    deliveryType: 'pickup',
    pickupStoreId: 'store_42',
};

describe('checkout API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useCreateCheckoutSession', () => {
        it('отправляет POST /checkout/session с данными заказа', async () => {
            mockApi.mockResolvedValue(MOCK_SESSION_RESPONSE);
            const { wrapper } = createWrapper();

            const { result } = renderHook(() => useCreateCheckoutSession(), { wrapper });

            result.current.mutate(MOCK_CREATE_PAYLOAD);

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(mockApi).toHaveBeenCalledWith('/checkout/session', {
                method: 'POST',
                body: MOCK_CREATE_PAYLOAD,
            });
            expect(result.current.data).toEqual(MOCK_SESSION_RESPONSE);
        });

        it('возвращает ошибку при неудачном запросе', async () => {
            mockApi.mockRejectedValue(new Error('Server error'));
            const { wrapper } = createWrapper();

            const { result } = renderHook(() => useCreateCheckoutSession(), { wrapper });

            result.current.mutate(MOCK_CREATE_PAYLOAD);

            await waitFor(() => expect(result.current.isError).toBe(true));
        });
    });

    describe('useCancelCheckoutSession', () => {
        it('отправляет DELETE /checkout/session/:id', async () => {
            mockApi.mockResolvedValue({ deleted: true });
            const { wrapper } = createWrapper();

            const { result } = renderHook(() => useCancelCheckoutSession(), { wrapper });

            result.current.mutate('sess_123');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(mockApi).toHaveBeenCalledWith('/checkout/session/sess_123', {
                method: 'DELETE',
            });
            expect(result.current.data).toEqual({ deleted: true });
        });

        it('возвращает ошибку при неудачном запросе', async () => {
            mockApi.mockRejectedValue(new Error('Not found'));
            const { wrapper } = createWrapper();

            const { result } = renderHook(() => useCancelCheckoutSession(), { wrapper });

            result.current.mutate('sess_404');

            await waitFor(() => expect(result.current.isError).toBe(true));
        });
    });
});
