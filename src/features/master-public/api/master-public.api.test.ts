import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, Suspense, type ReactNode } from 'react';
import { masterPublicKeys, useGetMasterById } from './master-public.api';

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

describe('masterPublicKeys', () => {
    it('byId() включает masterId в ключ', () => {
        expect(masterPublicKeys.byId(42)).toEqual(['master-public', 42]);
    });
});

describe('useGetMasterById', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('загружает публичный профиль мастера', async () => {
        const mockMaster = {
            id: 42,
            first_name: 'Иван',
            last_name: 'Петров',
            role: 'SERVICE',
            accountService: { grade: 'SPECIALIST' },
        };
        mockApi.mockResolvedValueOnce(mockMaster);

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useGetMasterById(42), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockMaster);
        expect(mockApi).toHaveBeenCalledWith('/curator/users/42/service');
    });

    it('ставит ошибку при неудачном запросе', async () => {
        mockApi.mockRejectedValueOnce(new Error('Not found'));

        const { wrapper, queryClient } = createWrapper();
        renderHook(() => useGetMasterById(99), { wrapper });

        await waitFor(() => {
            const state = queryClient.getQueryState(masterPublicKeys.byId(99));
            expect(state?.error).toBeInstanceOf(Error);
        });
    });
});
