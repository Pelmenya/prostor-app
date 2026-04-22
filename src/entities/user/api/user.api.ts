import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type { TUser } from '@/shared/model';

export function useCurrentUser() {
    const api = useApi();

    return useQuery({
        queryKey: ['user', 'me'],
        queryFn: () => api<TUser>('/auth/me'),
    });
}
