import {
    useMutation,
    useQuery,
    useQueryClient,
    useSuspenseInfiniteQuery,
    useSuspenseQuery,
} from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import { buildSearchParams } from '@/shared/lib';
import type { EOrderStatus } from '../model/types/e-order-status';
import type { EDeliveryType } from '../model/types/e-delivery-type';
import type { TWorkDay } from '@/shared/model';
import type { TOrder } from '../model/types/t-order';

// ---- Query Keys ----

export const orderKeys = {
    all: ['orders'] as const,
    list: (filters: TOrdersQueryFilters) => ['orders', 'list', filters] as const,
    count: (filters: TOrdersCountFilters) => ['orders', 'count', filters] as const,
    detail: (orderId: number) => ['orders', 'detail', orderId] as const,
};

// ---- Типы запросов ----

/** Фильтры для запросов к /order/all/filters — попадают в query key */
export type TOrdersQueryFilters = {
    limit?: number;
    cursor?: string;
    sortDir?: 'asc' | 'desc';
    status?: EOrderStatus[];
    clientId?: number;
    executorId?: number;
};

/** Опции хука — НЕ попадают в query key */
export type TOrdersQueryOptions = {
    enabled?: boolean;
};

/** @deprecated Используй TOrdersQueryFilters + TOrdersQueryOptions */
export type TOrdersQueryParams = TOrdersQueryFilters & TOrdersQueryOptions;

export type TOrdersCountFilters = {
    status?: EOrderStatus[];
};

/** @deprecated Используй TOrdersCountFilters + TOrdersQueryOptions */
export type TOrdersCountParams = TOrdersCountFilters & TOrdersQueryOptions;

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
 * Бесконечный список заказов с cursor-пагинацией.
 */
export function useGetOrders(filters: TOrdersQueryFilters) {
    const api = useApi();

    return useSuspenseInfiniteQuery({
        queryKey: orderKeys.list(filters),
        queryFn: ({ pageParam }: { pageParam: string | undefined }) => {
            const queryString = buildSearchParams({ ...filters, cursor: pageParam });
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
export function useGetOrdersCount(
    filters: TOrdersCountFilters,
    { enabled = true }: TOrdersQueryOptions = {},
) {
    const api = useApi();

    return useQuery({
        queryKey: orderKeys.count(filters),
        queryFn: () => {
            const queryString = buildSearchParams({ ...filters });
            return api<TOrdersCountResponse>(`/order/count?${queryString}`);
        },
        staleTime: 30_000,
        enabled,
    });
}

/**
 * Один заказ по ID.
 */
export function useGetOrderById(orderId: number) {
    const api = useApi();

    return useSuspenseQuery({
        queryKey: orderKeys.detail(orderId),
        queryFn: () => api<TOrder>(`/order/${orderId}`),
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

/**
 * Обновление даты/времени заказа куратором
 */
export function useUpdateOrderSchedule() {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ orderId, scheduledDate }: { orderId: number; scheduledDate: TWorkDay }) =>
            api<TOrder>(`/order/${orderId}/schedule`, {
                method: 'PATCH',
                body: { scheduledDate },
            }),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
        },
    });
}

/**
 * Добавление/обновление доставки ТК куратором
 */
export function useAddOrderDelivery() {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            orderId,
            deliveryCost,
            deliveryDescription,
        }: {
            orderId: number;
            deliveryCost: number | null;
            deliveryDescription?: string | null;
        }) =>
            api<TOrder>(`/order/${orderId}/delivery`, {
                method: 'PATCH',
                body: { deliveryCost, deliveryDescription },
            }),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
            void queryClient.invalidateQueries({ queryKey: orderKeys.all });
        },
    });
}

/**
 * Назначение/смена мастера куратором
 */
export function useUpdateOrderExecutor() {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ orderId, executorId }: { orderId: number; executorId: number }) =>
            api<TOrder>(`/order/${orderId}/executor`, {
                method: 'PATCH',
                body: { executorId },
            }),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
            void queryClient.invalidateQueries({ queryKey: orderKeys.all });
        },
    });
}
