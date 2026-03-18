import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type { TUser } from '../model/types/t-user';

export function useCurrentUser() {
    const api = useApi();

    return useQuery({
        queryKey: ['user', 'me'],
        queryFn: () => api<TUser>('/user/me'),
    });
}
