import type { EDeliveryType } from './e-delivery-type';
import type { EOrderStatus } from './e-order-status';

export type TOrder = {
    id: number;
    status: EOrderStatus;
    createdAt: string;
    deliveryType?: EDeliveryType;
};
