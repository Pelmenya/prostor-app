import {
    useMutation,
    useQuery,
    useQueryClient,
    useSuspenseInfiniteQuery,
    useSuspenseQuery,
} from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import { buildSearchParams } from '@/shared/lib';
import type { TCuratorUser, TCuratorServiceUser, TWorkDay } from '@/shared/model';
import { EUserRole } from '@/shared/model';

// ---- Типы тел запросов для редактирования мастера куратором ----

export type TUpdateMasterProfileBody = {
    first_name?: string;
    last_name?: string;
    phone?: string;
};

export type TUpdateMasterLocationBody = {
    address?: string;
    coordinates?: { type: 'Point'; coordinates: [number, number] };
    suggestion?: unknown;
    geoData?: unknown;
    departureBasis?: 'OWN_ADDRESS' | 'NEAREST_STORE';
    storeId?: string | null;
};

export type TUpdateMasterVehicleBody = {
    grade?: 'courier' | 'specialist' | 'senior_specialist' | 'master';
    carModel?: string;
    carNumber?: string;
    maxCargoLength?: number;
    maxCargoWidth?: number;
    maxCargoHeight?: number;
    maxCargoWeight?: number;
};

export type TUpdateMasterScheduleBody = {
    workDays?: TWorkDay[];
    calendarMonths?: number;
};

export const curatorUserKeys = {
    all: ['curator-users'] as const,
    list: (filters: TCuratorUsersFilters) => ['curator-users', 'list', filters] as const,
    count: (filters: TCuratorUsersCountFilters) => ['curator-users', 'count', filters] as const,
};

export type TCuratorUsersFilters = {
    limit?: number;
    sortDir?: 'asc' | 'desc';
    role?: EUserRole[];
    search?: string;
    isAuth?: boolean;
    dateFrom?: string;
    dateTo?: string;
};

export type TCuratorUsersCountFilters = Omit<TCuratorUsersFilters, 'limit' | 'sortDir'>;

type TCuratorUsersPaginatedResponse = {
    items: TCuratorUser[];
    nextCursor?: string | null;
    hasMore: boolean;
    count: number;
};

type TCuratorMastersPaginatedResponse = {
    items: TCuratorServiceUser[];
    nextCursor?: string | null;
    hasMore: boolean;
    count: number;
};

type TCuratorUsersCountResponse = {
    count: number;
};

export function useGetCuratorClientById(id: number) {
    const api = useApi();

    return useSuspenseQuery({
        queryKey: [...curatorUserKeys.all, 'client', id] as const,
        queryFn: () => api<TCuratorUser>(`/curator/users/${id}/client`),
        staleTime: 60_000,
    });
}

export function useGetCuratorUsers(filters: TCuratorUsersFilters) {
    const api = useApi();

    return useSuspenseInfiniteQuery({
        queryKey: curatorUserKeys.list(filters),
        queryFn: ({ pageParam }: { pageParam: string | undefined }) => {
            const queryString = buildSearchParams({ ...filters, cursor: pageParam });
            return api<TCuratorUsersPaginatedResponse>(`/curator/users/all/filters?${queryString}`);
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) =>
            lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
        staleTime: 30_000,
    });
}

export function useGetCuratorMasters(filters: Omit<TCuratorUsersFilters, 'role'>) {
    const api = useApi();

    return useSuspenseInfiniteQuery({
        queryKey: curatorUserKeys.list({ ...filters, role: [EUserRole.SERVICE] }),
        queryFn: ({ pageParam }: { pageParam: string | undefined }) => {
            const queryString = buildSearchParams({
                ...filters,
                role: [EUserRole.SERVICE],
                cursor: pageParam,
            });
            return api<TCuratorMastersPaginatedResponse>(
                `/curator/users/all/filters?${queryString}`,
            );
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) =>
            lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
        staleTime: 30_000,
    });
}

export function useGetCuratorServiceById(id: number) {
    const api = useApi();

    return useSuspenseQuery({
        queryKey: [...curatorUserKeys.all, 'service', id] as const,
        queryFn: () => api<TCuratorServiceUser>(`/curator/users/${id}/service`),
        staleTime: 60_000,
    });
}

export function useSetMasterCanEdit() {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, canEdit }: { userId: number; canEdit: boolean }) =>
            api(`/curator/users/${userId}/can-edit`, { method: 'PATCH', body: { canEdit } }),
        onSuccess: (_data, { userId }) => {
            void queryClient.invalidateQueries({
                queryKey: [...curatorUserKeys.all, 'service', userId],
            });
            void queryClient.invalidateQueries({ queryKey: curatorUserKeys.all });
        },
    });
}

export function useGetCuratorUsersCount(
    filters: TCuratorUsersCountFilters,
    { enabled = true }: { enabled?: boolean } = {},
) {
    const api = useApi();

    return useQuery({
        queryKey: curatorUserKeys.count(filters),
        queryFn: () => {
            const queryString = buildSearchParams({ ...filters });
            return api<TCuratorUsersCountResponse>(`/curator/users/count?${queryString}`);
        },
        staleTime: 30_000,
        enabled,
    });
}

// ---- Редактирование мастера куратором ----

function invalidateMaster(queryClient: ReturnType<typeof useQueryClient>, userId: number) {
    void queryClient.invalidateQueries({ queryKey: [...curatorUserKeys.all, 'service', userId] });
}

export function useUpdateMasterProfile() {
    const api = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, ...body }: { userId: number } & TUpdateMasterProfileBody) =>
            api(`/curator/users/${userId}/profile`, { method: 'PATCH', body }),
        onSuccess: (_data, { userId }) => invalidateMaster(queryClient, userId),
    });
}

export function useUpdateMasterLocation() {
    const api = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, ...body }: { userId: number } & TUpdateMasterLocationBody) =>
            api(`/curator/users/${userId}/account-service/location`, { method: 'PATCH', body }),
        onSuccess: (_data, { userId }) => invalidateMaster(queryClient, userId),
    });
}

export function useUpdateMasterVehicle() {
    const api = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, ...body }: { userId: number } & TUpdateMasterVehicleBody) =>
            api(`/curator/users/${userId}/account-service/vehicle`, { method: 'PATCH', body }),
        onSuccess: (_data, { userId }) => invalidateMaster(queryClient, userId),
    });
}

export function useUpdateMasterSchedule() {
    const api = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, ...body }: { userId: number } & TUpdateMasterScheduleBody) =>
            api(`/curator/users/${userId}/account-service/schedule`, { method: 'PATCH', body }),
        onSuccess: (_data, { userId }) => invalidateMaster(queryClient, userId),
    });
}

export function useFillMasterCalendar() {
    const api = useApi();
    return useMutation({
        mutationFn: (userId: number) =>
            api(`/curator/users/${userId}/fill-calendar`, { method: 'POST', body: {} }),
    });
}

export function useUpdateMasterZones() {
    const api = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, zoneIds }: { userId: number; zoneIds: number[] }) =>
            api(`/curator/users/${userId}/zones`, { method: 'PUT', body: { zoneIds } }),
        onSuccess: (_data, { userId }) => {
            void queryClient.invalidateQueries({
                queryKey: [...curatorUserKeys.all, 'zones', userId],
            });
        },
    });
}
