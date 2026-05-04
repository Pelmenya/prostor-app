import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type { TStore } from '../model/t-store';

export const storeKeys = {
    all: () => ['moy-sklad-store', 'list'] as const,
};

export function useGetStores() {
    const api = useApi();
    return useQuery<TStore[]>({
        queryKey: storeKeys.all(),
        queryFn: () => api<TStore[]>('/moysklad/store'),
        staleTime: 5 * 60_000,
    });
}
