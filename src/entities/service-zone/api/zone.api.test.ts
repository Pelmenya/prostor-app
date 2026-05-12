import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, Suspense, type ReactNode } from 'react';
import { zoneKeys, useGetMyZones, useGetZones, useUpdateMyZones } from './zone.api';

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

const MOCK_ZONES = [
    { id: 1, name: 'Зона 1', active: true },
    { id: 2, name: 'Зона 2', active: true },
];

describe('zoneKeys', () => {
    it('all() возвращает стабильный ключ', () => {
        expect(zoneKeys.all()).toEqual(['service-zone', 'all']);
    });

    it('my() возвращает стабильный ключ', () => {
        expect(zoneKeys.my()).toEqual(['service-zone', 'my']);
    });
});

describe('useGetZones', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('загружает список всех зон', async () => {
        mockApi.mockResolvedValueOnce(MOCK_ZONES);

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useGetZones(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(MOCK_ZONES);
        expect(mockApi).toHaveBeenCalledWith('/zones?withGeometry=true&active=true');
    });
});

describe('useGetMyZones', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('загружает зоны мастера', async () => {
        mockApi.mockResolvedValueOnce(MOCK_ZONES);

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useGetMyZones(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(MOCK_ZONES);
        expect(mockApi).toHaveBeenCalledWith('/zones/my');
    });

    it('возвращает пустой массив если API вернул null', async () => {
        mockApi.mockResolvedValueOnce(null);

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useGetMyZones(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([]);
    });
});

describe('useUpdateMyZones', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('вызывает PUT /zones/my с массивом id', async () => {
        mockApi.mockResolvedValueOnce(undefined);

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useUpdateMyZones(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync([1, 2, 3]);
        });

        expect(mockApi).toHaveBeenCalledWith('/zones/my', {
            method: 'PUT',
            body: { zoneIds: [1, 2, 3] },
        });
    });
});
