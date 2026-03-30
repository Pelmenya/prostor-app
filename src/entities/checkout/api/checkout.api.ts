import { useMutation } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type { TCreateCheckoutSession, TCheckoutSessionResponse } from '@/shared/model';

export function useCreateCheckoutSession() {
    const api = useApi();

    return useMutation({
        mutationFn: (data: TCreateCheckoutSession) =>
            api<TCheckoutSessionResponse>('/checkout/session', { method: 'POST', body: data }),
    });
}

export function useCancelCheckoutSession() {
    const api = useApi();

    return useMutation({
        mutationFn: (sessionId: string) =>
            api<{ deleted: boolean }>(`/checkout/session/${sessionId}`, { method: 'DELETE' }),
    });
}
