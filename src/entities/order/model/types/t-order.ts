import type { TUser } from '@/shared/model';
import type { TCartItem } from '@/shared/model';
import type { EDeliveryType } from './e-delivery-type';
import type { EOrderStatus } from './e-order-status';
import type { EPaymentStatus } from './e-payment-status';
import type { TWorkDay } from './t-work-day';

/** Сохранённое состояние корзины в заказе (снэпшот на момент создания) */
export type TOrderCartState = {
    id?: string | null;
    items: Record<string, TCartItem>;
    totalRateOfHours?: number;
    totalPrice?: number;
    totalProductsPrice?: number;
    totalServicesPrice?: number;
};

/** Объект недвижимости внутри заказа */
export type TOrderRealEstate = {
    id: number;
    address: string;
    city?: string;
    coordinates?: {
        type: 'Point';
        coordinates: number[];
    };
};

/** Информация о точке самовывоза */
export type TPickupStoreInfo = {
    id: string;
    name: string;
    address: string;
    phone?: string;
    coordinates?: {
        type: 'Point';
        coordinates: [number, number];
    };
};

/** Расписание (слот) заказа */
export type TScheduledDate = {
    id?: string;
    date: string;
    dayOfWeek?: number;
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
    areaId?: string;
    isDeleted?: boolean;
};

/** Полный тип заказа, получаемый с бэкенда */
export type TOrder = {
    id: number;
    client: TUser;
    realEstate: TOrderRealEstate;
    executor?: TUser;
    cartState: TOrderCartState;
    scheduledDate?: TScheduledDate;
    desiredIntervalDate?: [TWorkDay, TWorkDay];
    storeId?: string | null;
    status: EOrderStatus;
    deliveryType?: EDeliveryType;
    pickupStoreId?: string | null;
    organizationId?: string | null;
    cancellationReason?: string | null;
    createdAt: string;
    updatedAt: string;

    // Платежи
    paymentStatus: EPaymentStatus;
    totalAmount: number;
    currency: string;
    paidAt?: string;

    // Доставка
    deliveryCost?: number | null;
    deliveryDescription?: string | null;
    pickupStore?: TPickupStoreInfo;
};
