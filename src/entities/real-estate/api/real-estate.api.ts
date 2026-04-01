import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type {
    TRealEstate,
    TCreateRealEstate,
    TUpdateRealEstate,
    TRetailStoreWithRouteInfo,
} from '@/shared/model';

export const realEstateKeys = {
    all: ['real-estate'] as const,
    detail: (id: number) => ['real-estate', id] as const,
    nearestStores: (realEstateId: number) =>
        ['real-estate', 'nearest-stores', realEstateId] as const,
};

export function useRealEstates() {
    const api = useApi();

    return useQuery({
        queryKey: realEstateKeys.all,
        queryFn: () => api<TRealEstate[]>('/real-estate'),
    });
}

export function useRealEstate(id: number | undefined) {
    const api = useApi();

    return useQuery({
        queryKey: realEstateKeys.detail(id ?? 0),
        queryFn: () => api<TRealEstate>(`/real-estate/${id}`),
        enabled: id !== undefined && id > 0,
    });
}

export function useCreateRealEstate() {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: TCreateRealEstate) =>
            api<TRealEstate>('/real-estate', { method: 'POST', body: data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: realEstateKeys.all });
        },
    });
}

export function useUpdateRealEstate() {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: TUpdateRealEstate }) =>
            api<TRealEstate>(`/real-estate/${id}`, { method: 'PUT', body: data }),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: realEstateKeys.all });
            queryClient.invalidateQueries({ queryKey: realEstateKeys.detail(id) });
        },
    });
}

export function useDeleteRealEstate() {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) =>
            api<{ success: boolean }>(`/real-estate/${id}`, { method: 'DELETE' }),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: realEstateKeys.all });
            queryClient.removeQueries({ queryKey: realEstateKeys.detail(id) });
        },
    });
}

type TNearestRetailStoresParams = {
    realEstateId: number;
    limit?: number;
    cartItems?: { productId: string; count: number }[];
};

export function useNearestRetailStores(params: TNearestRetailStoresParams | null) {
    const api = useApi();

    return useQuery({
        queryKey: params
            ? [...realEstateKeys.nearestStores(params.realEstateId), params.cartItems ?? []]
            : ['real-estate', 'nearest-stores', null],
        queryFn: () => {
            const { realEstateId, limit = 10, cartItems } = params!;
            const search = new URLSearchParams({
                realEstateId: String(realEstateId),
                limit: String(limit),
            });
            return api<TRetailStoreWithRouteInfo[]>(`/real-estate/nearest-stores?${search}`, {
                method: 'POST',
                body: cartItems ? { cartItems } : {},
            });
        },
        enabled: params !== null,
    });
}
