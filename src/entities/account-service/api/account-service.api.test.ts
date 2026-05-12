import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, Suspense, type ReactNode } from 'react';
import { accountServiceKeys, useAccountServiceQuery, useGetWorkDays } from './account-service.api';

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

describe('accountServiceKeys', () => {
    it('my() возвращает стабильный ключ', () => {
        expect(accountServiceKeys.my()).toEqual(['account-service', 'my']);
    });

    it('workDays() возвращает стабильный ключ', () => {
        expect(accountServiceKeys.workDays()).toEqual(['schedule', 'work-days']);
    });
});

describe('useAccountServiceQuery', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('возвращает данные аккаунт-сервиса', async () => {
        const mockData = { id: 1, grade: 'SPECIALIST', address: 'ул. Ленина, 1' };
        mockApi.mockResolvedValueOnce(mockData);

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useAccountServiceQuery(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockData);
    });

    it('возвращает null если API вернул null', async () => {
        mockApi.mockResolvedValueOnce(null);

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useAccountServiceQuery(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toBeNull();
    });

    it('не делает запрос если enabled=false', () => {
        const { wrapper } = createWrapper();
        renderHook(() => useAccountServiceQuery({ enabled: false }), { wrapper });
        expect(mockApi).not.toHaveBeenCalled();
    });
});

describe('useGetWorkDays', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('возвращает список рабочих дней', async () => {
        const mockDays = [
            { date: '2026-05-01', startHour: 9, startMinute: 0, endHour: 18, endMinute: 0 },
        ];
        mockApi.mockResolvedValueOnce(mockDays);

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useGetWorkDays(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockDays);
    });

    it('возвращает пустой массив если API вернул null', async () => {
        mockApi.mockResolvedValueOnce(null);

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useGetWorkDays(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([]);
    });
});
