import type { EDeliveryType } from './e-delivery-type';

export type TOrder = {
    id: number;
    status: string;
    createdAt: string;
    deliveryType?: EDeliveryType;
};
