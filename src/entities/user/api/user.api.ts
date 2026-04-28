import { useMutation, useQuery, useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type { TUser } from '@/shared/model';

export function useCurrentUser() {
    const api = useApi();

    return useQuery({
        queryKey: ['user', 'me'],
        queryFn: () => api<TUser>('/auth/me'),
    });
}

export function useCurrentUserSuspense() {
    const api = useApi();

    return useSuspenseQuery({
        queryKey: ['user', 'me'],
        queryFn: () => api<TUser>('/auth/me'),
    });
}

export function useUpdateProfile() {
    const api = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { first_name?: string; last_name?: string; phone?: string }) =>
            api<TUser>('/auth/profile', { method: 'PATCH', body: data }),
        onSuccess: (updated) => {
            queryClient.setQueryData(['user', 'me'], updated);
        },
    });
}
