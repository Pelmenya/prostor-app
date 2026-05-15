import { useQuery, useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import { buildSearchParams } from '@/shared/lib';
import type { EUserRole } from '@/shared/model';
import type { TCuratorUser } from '@/shared/model';

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

type TCuratorUsersCountResponse = {
    count: number;
};

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
