import { useMutation, useQuery, useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type {
    TOrderFeedback,
    TOrderFeedbackParameters,
    TExecutorAverageRating,
} from '@/shared/model';

export const orderFeedbackKeys = {
    myFeedback: (orderId: number) => ['order-feedback', 'my', orderId] as const,
    byOrder: (orderId: number) => ['order-feedback', 'by-order', orderId] as const,
    executorAverage: (userId?: number) => ['order-feedback', 'executor-average', userId] as const,
    executorDetailed: (executorId: number) =>
        ['order-feedback', 'executor-detailed', executorId] as const,
};

export function useGetMyOrderFeedback(orderId: number) {
    const api = useApi();
    return useSuspenseQuery<TOrderFeedback | null>({
        queryKey: orderFeedbackKeys.myFeedback(orderId),
        queryFn: async () =>
            (await api<TOrderFeedback | null>(`/order-feedback/order/${orderId}/my`)) ?? null,
    });
}

export function useCreateOrderFeedback() {
    const api = useApi();
    const queryClient = useQueryClient();
    return useMutation<
        TOrderFeedback,
        Error,
        {
            orderId: number;
            executorId: number;
            clientParameters: TOrderFeedbackParameters;
            comment?: string;
        }
    >({
        mutationFn: ({ orderId, executorId, clientParameters, comment }) =>
            api<TOrderFeedback>('/order-feedback', {
                method: 'POST',
                body: { orderId, executorId, clientParameters, comment },
            }),
        onSuccess: (_, { orderId, executorId }) => {
            void queryClient.invalidateQueries({ queryKey: orderFeedbackKeys.myFeedback(orderId) });
            void queryClient.invalidateQueries({ queryKey: orderFeedbackKeys.byOrder(orderId) });
            void queryClient.invalidateQueries({
                queryKey: orderFeedbackKeys.executorAverage(executorId),
            });
            void queryClient.invalidateQueries({
                queryKey: orderFeedbackKeys.executorDetailed(executorId),
            });
        },
    });
}

export function useGetExecutorAverageRating(userId?: number) {
    const api = useApi();
    return useQuery<TExecutorAverageRating>({
        queryKey: orderFeedbackKeys.executorAverage(userId),
        queryFn: () => api<TExecutorAverageRating>(`/order-feedback/executor/${userId}/average`),
        enabled: !!userId,
    });
}

export function useUpdateOrderFeedback() {
    const api = useApi();
    const queryClient = useQueryClient();
    return useMutation<
        TOrderFeedback,
        Error,
        {
            feedbackId: string;
            orderId: number;
            executorId: number;
            clientParameters?: TOrderFeedbackParameters;
            comment?: string;
        }
    >({
        mutationFn: ({ feedbackId, clientParameters, comment }) =>
            api<TOrderFeedback>(`/order-feedback/${feedbackId}`, {
                method: 'PATCH',
                body: { clientParameters, comment },
            }),
        onSuccess: (_, { orderId, executorId }) => {
            void queryClient.invalidateQueries({ queryKey: orderFeedbackKeys.myFeedback(orderId) });
            void queryClient.invalidateQueries({ queryKey: orderFeedbackKeys.byOrder(orderId) });
            void queryClient.invalidateQueries({
                queryKey: orderFeedbackKeys.executorAverage(executorId),
            });
            void queryClient.invalidateQueries({
                queryKey: orderFeedbackKeys.executorDetailed(executorId),
            });
        },
    });
}
