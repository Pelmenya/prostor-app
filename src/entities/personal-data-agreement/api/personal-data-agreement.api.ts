import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import type { TLegalDocument } from '@/shared/model';

export type TPersonalDataAgreement = TLegalDocument;

export function useCurrentAgreement() {
    return useQuery({
        queryKey: ['personal-data-agreement', 'current'],
        queryFn: () => apiClient<TPersonalDataAgreement>('/personal-data-agreement/current'),
        staleTime: 30 * 60 * 1000,
    });
}
