import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type {
    TInstalledEquipment,
    TInstalledComponent,
    TCreateInstalledEquipment,
    TUpdateInstalledEquipment,
} from '@/shared/model';

export const installedEquipmentKeys = {
    byRealEstate: (realEstateId: number) =>
        ['installed-equipment', 'by-real-estate', realEstateId] as const,
    detail: (id: string) => ['installed-equipment', id] as const,
    reminders: (daysAhead?: number) =>
        ['installed-equipment', 'reminders', daysAhead ?? null] as const,
};

/** Оборудование для нескольких адресов — батч через useQueries */
export function useInstalledEquipmentForRealEstates(realEstateIds: number[]) {
    const api = useApi();

    const results = useQueries({
        queries: realEstateIds.map((id) => ({
            queryKey: installedEquipmentKeys.byRealEstate(id),
            queryFn: () => api<TInstalledEquipment[]>(`/installed-equipment/by-real-estate/${id}`),
            enabled: id > 0,
        })),
    });

    const equipmentByRealEstate: Record<number, TInstalledEquipment[]> = {};
    realEstateIds.forEach((id, idx) => {
        equipmentByRealEstate[id] = results[idx].data ?? [];
    });

    return {
        equipmentByRealEstate,
        isLoading: results.some((r) => r.isLoading),
    };
}

export function useInstalledEquipmentByRealEstate(realEstateId: number | undefined) {
    const api = useApi();

    return useQuery({
        queryKey: installedEquipmentKeys.byRealEstate(realEstateId ?? 0),
        queryFn: () =>
            api<TInstalledEquipment[]>(`/installed-equipment/by-real-estate/${realEstateId}`),
        enabled: !!realEstateId,
    });
}

export function useCreateInstalledEquipment() {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: TCreateInstalledEquipment) =>
            api<TInstalledEquipment>('/installed-equipment', { method: 'POST', body: data }),
        onSuccess: (result) => {
            if (result.realEstate?.id) {
                queryClient.invalidateQueries({
                    queryKey: installedEquipmentKeys.byRealEstate(result.realEstate.id),
                });
            }
        },
    });
}

export function useUpdateInstalledEquipment(realEstateId: number) {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: TUpdateInstalledEquipment }) =>
            api<TInstalledEquipment>(`/installed-equipment/${id}`, { method: 'PATCH', body: data }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: installedEquipmentKeys.byRealEstate(realEstateId),
            });
        },
    });
}

export function useReplaceComponent(realEstateId: number) {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ componentId, replacedAt }: { componentId: string; replacedAt?: string }) =>
            api<TInstalledComponent>(`/installed-equipment/component/${componentId}/replace`, {
                method: 'PATCH',
                body: replacedAt ? { replacedAt } : {},
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: installedEquipmentKeys.byRealEstate(realEstateId),
            });
        },
    });
}
