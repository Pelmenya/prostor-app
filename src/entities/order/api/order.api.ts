import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import { buildSearchParams } from '@/shared/lib';
import type { EOrderStatus } from '../model/types/e-order-status';
import type { EDeliveryType } from '../model/types/e-delivery-type';
import type { TWorkDay } from '../model/types/t-work-day';
import type { TOrder } from '../model/types/t-order';

// ---- Query Keys ----

export const orderKeys = {
    all: ['orders'] as const,
    list: (params: TOrdersQueryParams) => ['orders', 'list', params] as const,
    count: (params: TOrdersCountParams) => ['orders', 'count', params] as const,
    detail: (orderId: number) => ['orders', 'detail', orderId] as const,
};

// ---- Типы запросов ----

export type TOrdersQueryParams = {
    limit?: number;
    cursor?: string;
    sortDir?: 'asc' | 'desc';
    status?: EOrderStatus[];
};

export type TOrdersCountParams = {
    status?: EOrderStatus[];
};

type TOrdersPaginatedResponse = {
    items: TOrder[];
    nextCursor?: string | null;
    hasMore: boolean;
};

type TOrdersCountResponse = {
    count: number;
};

type TCreateOrderBody = {
    clientId: number;
    realEstateId: number;
    cartId: string;
    deliveryType?: EDeliveryType;
    pickupStoreId?: string;
    organizationId?: string;
    executorId?: number;
    scheduledDate?: TWorkDay;
    desiredIntervalDate?: [TWorkDay, TWorkDay];
    clientComment?: string;
    email?: string;
};

// ---- Хуки ----

/**
 * Бесконечный список заказов с cursor-пагинацией
 */
export function useGetOrders(params: TOrdersQueryParams) {
    const api = useApi();

    return useInfiniteQuery({
        queryKey: orderKeys.list(params),
        queryFn: ({ pageParam }) => {
            const queryString = buildSearchParams({
                ...params,
                cursor: pageParam,
            });
            return api<TOrdersPaginatedResponse>(`/order/all/filters?${queryString}`);
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) =>
            lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
        staleTime: 30_000,
    });
}

/**
 * Счётчик заказов по фильтрам (для бейджей на табах)
 */
export function useGetOrdersCount(params: TOrdersCountParams) {
    const api = useApi();

    return useQuery({
        queryKey: orderKeys.count(params),
        queryFn: () => {
            const queryString = buildSearchParams({ ...params });
            return api<TOrdersCountResponse>(`/order/count?${queryString}`);
        },
        staleTime: 30_000,
    });
}

/**
 * Один заказ по ID
 */
export function useGetOrderById(orderId: number) {
    const api = useApi();

    return useQuery({
        queryKey: orderKeys.detail(orderId),
        queryFn: () => api<TOrder>(`/order/${orderId}`),
        enabled: orderId > 0,
    });
}

/**
 * Создание заказа
 */
export function useCreateOrder() {
    const api = useApi();

    return useMutation({
        mutationFn: (body: TCreateOrderBody) => api<TOrder>('/order', { method: 'POST', body }),
    });
}

/**
 * Обновление статуса заказа
 */
export function useUpdateOrderStatus() {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ orderId, status }: { orderId: number; status: EOrderStatus }) =>
            api<TOrder>(`/order/${orderId}/status`, {
                method: 'PATCH',
                body: { status },
            }),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
            void queryClient.invalidateQueries({ queryKey: orderKeys.all });
        },
    });
}
