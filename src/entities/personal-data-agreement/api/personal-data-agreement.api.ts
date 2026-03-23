import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';

export type TPersonalDataAgreement = {
    version: string;
    content: string;
    effectiveDate: string;
};

export function useCurrentAgreement() {
    return useQuery({
        queryKey: ['personal-data-agreement', 'current'],
        queryFn: () => apiClient<TPersonalDataAgreement>('/personal-data-agreement/current'),
        staleTime: 30 * 60 * 1000,
    });
}
