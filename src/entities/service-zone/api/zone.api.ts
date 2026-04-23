import { useMutation, useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type { TServiceZone } from '../model/t-service-zone';

export const zoneKeys = {
    all: () => ['service-zone', 'all'] as const,
    my: () => ['service-zone', 'my'] as const,
};

export function useGetZones() {
    const api = useApi();
    return useSuspenseQuery<TServiceZone[]>({
        queryKey: zoneKeys.all(),
        queryFn: () => api<TServiceZone[]>('/zones?withGeometry=true&active=true'),
        staleTime: 60_000,
    });
}

export function useGetMyZones() {
    const api = useApi();
    return useSuspenseQuery<TServiceZone[]>({
        queryKey: zoneKeys.my(),
        queryFn: async () => {
            const data = await api<TServiceZone[]>('/zones/my');
            return data ?? [];
        },
    });
}

export function useUpdateMyZones() {
    const api = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (zoneIds: number[]) => api('/zones/my', { method: 'PUT', body: { zoneIds } }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: zoneKeys.my() });
        },
    });
}
