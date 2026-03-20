import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';

export type TPrivacyPolicy = {
    version: string;
    content: string;
    effectiveDate: string;
};

export function useCurrentPolicy() {
    return useQuery({
        queryKey: ['privacy-policy', 'current'],
        queryFn: () => apiClient<TPrivacyPolicy>('/privacy-policy/current'),
        staleTime: 30 * 60 * 1000,
    });
}
