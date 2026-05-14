import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { storeKeys, useGetStores } from './store.api';

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

const MOCK_STORES = [
    { id: 'store-1', name: 'Склад 1' },
    { id: 'store-2', name: 'Склад 2' },
];

describe('storeKeys', () => {
    it('all() возвращает стабильный ключ', () => {
        expect(storeKeys.all()).toEqual(['moy-sklad-store', 'list']);
    });
});

describe('useGetStores', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('загружает список складов', async () => {
        mockApi.mockResolvedValueOnce(MOCK_STORES);

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useGetStores(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(MOCK_STORES);
        expect(mockApi).toHaveBeenCalledWith('/moysklad/store');
    });

    it('возвращает undefined если запрос не выполнен', () => {
        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useGetStores(), { wrapper });
        expect(result.current.isLoading).toBe(true);
    });
});
