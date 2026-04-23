import { useSuspenseQuery } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type { TAccountService } from '../model/t-account-service';

export const accountServiceKeys = {
    my: () => ['account-service', 'my'] as const,
};

export function useAccountService() {
    const api = useApi();
    return useSuspenseQuery<TAccountService>({
        queryKey: accountServiceKeys.my(),
        queryFn: () => api<TAccountService>('/service/account'),
    });
}
