import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type { TOrderFeedback } from '../model/types/t-order-feedback';
import type { TParameters } from '../model/types/t-order-feedback-parameters';
import type { TExecutorAverageRating } from '../model/types/t-executor-average-rating';
import type { TDetailedRating } from '../model/types/t-detailed-rating';

export const orderFeedbackKeys = {
    myFeedback: (orderId: number) => ['order-feedback', 'my', orderId] as const,
    byOrder: (orderId: number) => ['order-feedback', 'by-order', orderId] as const,
    executorAverage: (userId?: number) => ['order-feedback', 'executor-average', userId] as const,
    executorDetailed: (executorId: number) =>
        ['order-feedback', 'executor-detailed', executorId] as const,
};

export function useGetMyOrderFeedback(orderId: number, options?: { enabled?: boolean }) {
    const api = useApi();
    return useQuery<TOrderFeedback | null>({
        queryKey: orderFeedbackKeys.myFeedback(orderId),
        queryFn: () => api<TOrderFeedback | null>(`/order-feedback/order/${orderId}/my`),
        enabled: options?.enabled ?? true,
    });
}

export function useGetOrderFeedbackByOrderId(orderId: number, options?: { enabled?: boolean }) {
    const api = useApi();
    return useQuery<TOrderFeedback[]>({
        queryKey: orderFeedbackKeys.byOrder(orderId),
        queryFn: async () => {
            const result = await api<TOrderFeedback[] | null>(`/order-feedback/order/${orderId}`);
            return result ?? [];
        },
        enabled: options?.enabled ?? true,
    });
}

export function useCreateOrderFeedback() {
    const api = useApi();
    const queryClient = useQueryClient();
    return useMutation<
        TOrderFeedback,
        Error,
        { orderId: number; executorId: number; clientParameters: TParameters; comment?: string }
    >({
        mutationFn: ({ orderId, executorId, clientParameters, comment }) =>
            api<TOrderFeedback>('/order-feedback', {
                method: 'POST',
                body: { orderId, executorId, clientParameters, comment },
            }),
        onSuccess: (_, { orderId }) => {
            void queryClient.invalidateQueries({ queryKey: orderFeedbackKeys.myFeedback(orderId) });
        },
    });
}

export function useUpdateOrderFeedback() {
    const api = useApi();
    const queryClient = useQueryClient();
    return useMutation<
        TOrderFeedback,
        Error,
        { feedbackId: string; orderId: number; clientParameters?: TParameters; comment?: string }
    >({
        mutationFn: ({ feedbackId, clientParameters, comment }) =>
            api<TOrderFeedback>(`/order-feedback/${feedbackId}`, {
                method: 'PATCH',
                body: { clientParameters, comment },
            }),
        onSuccess: (_, { orderId }) => {
            void queryClient.invalidateQueries({ queryKey: orderFeedbackKeys.myFeedback(orderId) });
        },
    });
}

export function useGetExecutorAverageRating(userId?: number, options?: { enabled?: boolean }) {
    const api = useApi();
    return useQuery<TExecutorAverageRating>({
        queryKey: orderFeedbackKeys.executorAverage(userId),
        queryFn: () => {
            const url = userId
                ? `/order-feedback/executor/average?userId=${userId}`
                : `/order-feedback/executor/average`;
            return api<TExecutorAverageRating>(url);
        },
        enabled: options?.enabled ?? true,
    });
}

export function useGetExecutorDetailedRating(executorId: number, options?: { enabled?: boolean }) {
    const api = useApi();
    return useQuery<TDetailedRating>({
        queryKey: orderFeedbackKeys.executorDetailed(executorId),
        queryFn: () => api<TDetailedRating>(`/order-feedback/executor/${executorId}/detailed`),
        enabled: options?.enabled ?? true,
    });
}
