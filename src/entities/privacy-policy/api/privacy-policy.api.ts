import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import type { TLegalDocument } from '@/shared/model';

export type TPrivacyPolicy = TLegalDocument;

export function useCurrentPolicy() {
    return useQuery({
        queryKey: ['privacy-policy', 'current'],
        queryFn: () => apiClient<TPrivacyPolicy>('/privacy-policy/current'),
        staleTime: 30 * 60 * 1000,
    });
}

export function fetchCurrentPolicy(): Promise<TPrivacyPolicy> {
    return apiClient<TPrivacyPolicy>('/privacy-policy/current');
}
