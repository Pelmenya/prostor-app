import { useSuspenseQuery } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type { TOrder } from '@/entities/order';

export const workDayKeys = {
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

export function useGetOrdersByDate(date: string) {
    const api = useApi();
    return useSuspenseQuery<TOrder[]>({
        queryKey: workDayKeys.orders(date),
        queryFn: async () => {
            try {
                const data = await api<TOrder[]>(`/service/work-day/${date}`);
                return data ?? [];
            } catch {
                return [];
            }
        },
    });
}

export function useGetWorkDayRoute(date: string) {
    const api = useApi();
    return useSuspenseQuery<TWorkDayRouteResponse | null>({
        queryKey: workDayKeys.route(date),
        queryFn: async () => {
            try {
                const data = await api<TWorkDayRouteResponse>(`/service/work-day/${date}/route`);
                return data ?? null;
            } catch {
                return null;
            }
        },
    });
}
