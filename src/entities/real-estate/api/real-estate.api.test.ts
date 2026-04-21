import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, Suspense, type ReactNode } from 'react';
import {
    realEstateKeys,
    useRealEstates,
    useRealEstate,
    useCreateRealEstate,
    useUpdateRealEstate,
    useDeleteRealEstate,
} from './real-estate.api';
import type { TCreateRealEstate } from '@/shared/model';

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

const MOCK_REAL_ESTATE = {
    id: 1,
    address: 'Москва, ул. Ленина, 1',
    geoData: null,
    suggestion: null,
    coordinates: { type: 'Point' as const, coordinates: [37.6, 55.7] as [number, number] },
    activeType: 'apartment' as const,
    residents: 3,
    activeSource: 'waterSupply' as const,
    waterIntakePoints: {
        toilet: 1,
        sink: 2,
        bath: 1,
        washingMachine: 1,
        dishWasher: 0,
        showerCabin: 1,
    },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
};

describe('real-estate API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('realEstateKeys', () => {
        it('all — корректный ключ', () => {
            expect(realEstateKeys.all).toEqual(['real-estate']);
        });

        it('detail — включает id', () => {
            expect(realEstateKeys.detail(42)).toEqual(['real-estate', 42]);
        });
    });

    describe('useRealEstates', () => {
        it('запрашивает GET /real-estate', async () => {
            mockApi.mockResolvedValue([MOCK_REAL_ESTATE]);
            const { wrapper } = createWrapper();

            const { result } = renderHook(() => useRealEstates(), { wrapper });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(mockApi).toHaveBeenCalledWith('/real-estate');
            expect(result.current.data).toEqual([MOCK_REAL_ESTATE]);
        });
    });

    describe('useRealEstate', () => {
        it('запрашивает GET /real-estate/:id', async () => {
            mockApi.mockResolvedValue(MOCK_REAL_ESTATE);
            const { wrapper } = createWrapper();

            const { result } = renderHook(() => useRealEstate(1), { wrapper });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(mockApi).toHaveBeenCalledWith('/real-estate/1');
        });
    });

    describe('useCreateRealEstate', () => {
        it('POST /real-estate и инвалидирует список', async () => {
            mockApi.mockResolvedValue(MOCK_REAL_ESTATE);
            const { wrapper, queryClient } = createWrapper();
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            const { result } = renderHook(() => useCreateRealEstate(), { wrapper });

            const createData: TCreateRealEstate = {
                activeType: 'apartment',
                residents: 3,
                activeSource: 'waterSupply',
                waterIntakePoints: {
                    toilet: 1,
                    sink: 2,
                    bath: 1,
                    washingMachine: 1,
                    dishWasher: 0,
                    showerCabin: 1,
                },
            };

            result.current.mutate(createData);

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(mockApi).toHaveBeenCalledWith('/real-estate', {
                method: 'POST',
                body: createData,
            });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: realEstateKeys.all });
        });
    });

    describe('useUpdateRealEstate', () => {
        it('PUT /real-estate/:id и инвалидирует список + деталь', async () => {
            mockApi.mockResolvedValue(MOCK_REAL_ESTATE);
            const { wrapper, queryClient } = createWrapper();
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            const { result } = renderHook(() => useUpdateRealEstate(), { wrapper });

            result.current.mutate({ id: 1, data: { residents: 5 } });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(mockApi).toHaveBeenCalledWith('/real-estate/1', {
                method: 'PUT',
                body: { residents: 5 },
            });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: realEstateKeys.all });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: realEstateKeys.detail(1) });
        });
    });

    describe('useDeleteRealEstate', () => {
        it('DELETE /real-estate/:id и инвалидирует список', async () => {
            mockApi.mockResolvedValue({ success: true });
            const { wrapper, queryClient } = createWrapper();
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            const { result } = renderHook(() => useDeleteRealEstate(), { wrapper });

            result.current.mutate(1);

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(mockApi).toHaveBeenCalledWith('/real-estate/1', { method: 'DELETE' });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: realEstateKeys.all });
        });
    });
});
