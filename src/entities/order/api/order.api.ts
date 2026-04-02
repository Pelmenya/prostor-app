import { useMutation } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type { EDeliveryType } from '../model/types/e-delivery-type';
import type { TWorkDay } from '../model/types/t-work-day';
import type { TOrder } from '../model/types/t-order';

type TCreateOrderBody = {
    clientId: number;
    realEstateId: number;
    cartId: string;
    deliveryType?: EDeliveryType;
    pickupStoreId?: string;
    organizationId?: string;
    executorId?: number;
    scheduledDate?: TWorkDay;
    desiredIntervalDate?: [TWorkDay, TWorkDay];
    clientComment?: string;
    email?: string;
};

export function useCreateOrder() {
    const api = useApi();

    return useMutation({
        mutationFn: (body: TCreateOrderBody) => api<TOrder>('/order', { method: 'POST', body }),
    });
}
