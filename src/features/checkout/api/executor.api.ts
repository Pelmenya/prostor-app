import { useMutation } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type { TUserWithWorkDays } from '../model/types/t-user-with-work-days';

type TFilteredExecutorsResponse = {
    executors: TUserWithWorkDays[];
    allMastersRejectedByCargo: boolean;
    hasProductsWithoutDimensions: boolean;
};

type TFilterExecutorsBody = {
    realEstateId: number;
    serviceIds?: string[];
    productItems?: { productId: string; count: number }[];
};

export function useFilteredExecutors() {
    const api = useApi();

    return useMutation({
        mutationFn: (body: TFilterExecutorsBody) =>
            api<TFilteredExecutorsResponse>('/service/executors/filtered', {
                method: 'POST',
                body,
            }),
    });
}
