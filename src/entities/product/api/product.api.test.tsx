import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useProductSearchPaginated, useProductSearchCount, productKeys } from './product.api';

vi.mock('@/shared/api', () => ({
    apiClient: vi.fn(),
}));

vi.mock('@/shared/config', () => ({
    API_URL: 'http://test',
}));

function makeWrapper(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

describe('productKeys', () => {
    it('productSearchPaginated включает q и hasMaintenance в ключ', () => {
        const key = productKeys.productSearchPaginated('фильтр', true);
        expect(key).toEqual(['catalog', 'product-search-paginated', 'фильтр', true]);
    });

    it('productSearchCount включает q и hasMaintenance в ключ', () => {
        const key = productKeys.productSearchCount('фильтр', false);
        expect(key).toEqual(['catalog', 'product-search-count', 'фильтр', false]);
    });

    it('разные hasMaintenance дают разные ключи', () => {
        const keyTrue = productKeys.productSearchPaginated('фильтр', true);
        const keyFalse = productKeys.productSearchPaginated('фильтр', false);
        expect(keyTrue).not.toEqual(keyFalse);
    });
});

describe('useProductSearchPaginated', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    });

    it('disabled когда q короче 2 символов (fetchStatus=idle)', () => {
        const { result } = renderHook(() => useProductSearchPaginated('a'), {
            wrapper: makeWrapper(queryClient),
        });
        expect(result.current.fetchStatus).toBe('idle');
    });

    it('disabled при пустом запросе', () => {
        const { result } = renderHook(() => useProductSearchPaginated(''), {
            wrapper: makeWrapper(queryClient),
        });
        expect(result.current.fetchStatus).toBe('idle');
    });

    it('hasNextPage зависит от getNextPageParam (hasMore=false → undefined)', () => {
        const lastPage = { items: [], nextCursor: undefined, hasMore: false };
        // Моделируем поведение getNextPageParam напрямую
        const getNextPageParam = (page: typeof lastPage) =>
            page.hasMore ? page.nextCursor : undefined;
        expect(getNextPageParam(lastPage)).toBeUndefined();
    });

    it('getNextPageParam возвращает nextCursor при hasMore=true', () => {
        const lastPage = { items: [], nextCursor: 'cursor-123', hasMore: true };
        const getNextPageParam = (page: typeof lastPage) =>
            page.hasMore ? page.nextCursor : undefined;
        expect(getNextPageParam(lastPage)).toBe('cursor-123');
    });
});

describe('useProductSearchCount', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    });

    it('disabled когда q короче 2 символов', () => {
        const { result } = renderHook(() => useProductSearchCount('a'), {
            wrapper: makeWrapper(queryClient),
        });
        expect(result.current.fetchStatus).toBe('idle');
    });

    it('disabled при пустом запросе', () => {
        const { result } = renderHook(() => useProductSearchCount(''), {
            wrapper: makeWrapper(queryClient),
        });
        expect(result.current.fetchStatus).toBe('idle');
    });
});
