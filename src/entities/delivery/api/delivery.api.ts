import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/shared/api';

export type TClientVisitPriceItem = {
    executorId: number;
    totalPrice: number;
    distanceKm: number;
    pricePerKm: number;
    departureName: string;
};

export const deliveryKeys = {
    visitPrices: (realEstateId: number, executorIds: number[]) =>
        ['delivery', 'visit-prices', realEstateId, executorIds] as const,
};

type TUseClientVisitPricesParams = {
    realEstateId: number;
    executorIds: number[];
    enabled?: boolean;
};

export function useClientVisitPrices({
    realEstateId,
    executorIds,
    enabled = true,
}: TUseClientVisitPricesParams) {
    const api = useApi();

    return useQuery({
        queryKey: deliveryKeys.visitPrices(realEstateId, executorIds),
        queryFn: () =>
            api<TClientVisitPriceItem[]>(
                `/delivery/client-visit-prices?realEstateId=${realEstateId}&executorIds=${executorIds.join(',')}`,
            ),
        enabled: enabled && realEstateId > 0 && executorIds.length > 0,
    });
}
