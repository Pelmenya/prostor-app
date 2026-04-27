import { useMutation, useSuspenseQuery, useQueryClient, useQuery } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type { TAccountService } from '../model/t-account-service';
import type { TUpdateAccountService } from '../model/t-update-account-service';
import type { TWorkDay } from '@/shared/model';

export const accountServiceKeys = {
    my: () => ['account-service', 'my'] as const,
    workDays: () => ['schedule', 'work-days'] as const,
};

export function useGetWorkDays() {
    const api = useApi();
    return useQuery<TWorkDay[]>({
        queryKey: accountServiceKeys.workDays(),
        queryFn: async () => {
            const data = await api<TWorkDay[]>('/service/work-days');
            return data ?? [];
        },
    });
}

export function useAccountService() {
    const api = useApi();
    return useSuspenseQuery<TAccountService | null>({
        queryKey: accountServiceKeys.my(),
        queryFn: async () => {
            const data = await api<TAccountService | null>('/service/account');
            return data ?? null;
        },
    });
}

export function useUpdateAccountService() {
    const api = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: TUpdateAccountService) =>
            api<TAccountService>('/service/account', { method: 'POST', body: data }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: accountServiceKeys.my() });
        },
    });
}
