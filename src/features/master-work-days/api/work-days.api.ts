import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type { TWorkDay } from '@/shared/model';
import type { TOrder } from '@/entities/order';

// Общий ключ с features/master-schedule — кеш shared через TanStack Query
export const workDayKeys = {
    list: () => ['schedule', 'work-days'] as const,
    orders: (date: string) => ['schedule', 'work-day', date, 'orders'] as const,
    route: (date: string) => ['schedule', 'work-day', date, 'route'] as const,
};

export type TOsrmLeg = {
    duration: number;
    distance: number;
};

export type TOsrmRoute = {
    geometry: { coordinates: [number, number][]; type: string };
    legs: TOsrmLeg[];
    duration: number;
    distance: number;
};

export type TWorkDayRouteResponse = {
    route: { routes: TOsrmRoute[] };
    sortOrders: TOrder[];
};

export function useGetWorkDaysForCalendar() {
    const api = useApi();
    return useQuery<TWorkDay[]>({
        queryKey: workDayKeys.list(),
        queryFn: async () => {
            const data = await api<TWorkDay[]>('/service/work-days');
            return data ?? [];
        },
    });
}

export function useGetOrdersByDate(date: string) {
    const api = useApi();
    return useSuspenseQuery<TOrder[]>({
        queryKey: workDayKeys.orders(date),
        queryFn: async () => {
            const data = await api<TOrder[]>(`/service/work-day/${date}`);
            return data ?? [];
        },
    });
}

export function useGetWorkDayRoute(date: string) {
    const api = useApi();
    return useSuspenseQuery<TWorkDayRouteResponse | null>({
        queryKey: workDayKeys.route(date),
        queryFn: async () => {
            const data = await api<TWorkDayRouteResponse>(`/service/work-day/${date}/route`);
            return data ?? null;
        },
    });
}
