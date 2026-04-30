import { useSuspenseQuery } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type { TUser } from '@/entities/user';
import type { TAccountService } from '@/entities/account-service';

export type TMasterPublicProfile = TUser & {
    accountService?: TAccountService | null;
    avgRating?: number;
};

export const masterPublicKeys = {
    byId: (id: number) => ['master-public', id] as const,
};

export function useGetMasterById(masterId: number) {
    const api = useApi();
    return useSuspenseQuery<TMasterPublicProfile>({
        queryKey: masterPublicKeys.byId(masterId),
        queryFn: () => api<TMasterPublicProfile>(`/curator/users/${masterId}/service`),
    });
}
