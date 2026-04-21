import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type { TOrderFeedback, TOrderFeedbackParameters } from '@/shared/model';

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
        queryFn: async () =>
            (await api<TOrderFeedback | null>(`/order-feedback/order/${orderId}/my`)) ?? null,
        enabled: options?.enabled ?? true,
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
