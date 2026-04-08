// API
export {
    useCreateOrder,
    useGetOrders,
    useGetOrdersCount,
    useGetOrderById,
    useUpdateOrderStatus,
    orderKeys,
} from './api/order.api';
export type { TOrdersQueryParams, TOrdersCountParams } from './api/order.api';

// Типы
export { EDeliveryType } from './model/types/e-delivery-type';
export { EOrderStatus } from './model/types/e-order-status';
export { EPaymentStatus } from './model/types/e-payment-status';
export type {
    TOrder,
    TOrderCartState,
    TOrderRealEstate,
    TPickupStoreInfo,
    TScheduledDate,
} from './model/types/t-order';
export type { TWorkDay } from './model/types/t-work-day';

// Lib
export { STATUS_TEXT } from './lib/status-text';
export { STATUS_STEP, STATUS_LABEL } from './lib/status-config';
export { SERVICE_GROUPS } from './lib/service-groups';
export { getServiceInfo } from './lib/get-service-info';
export { useOrderPositionsGrouped } from './lib/use-order-positions-grouped';

// UI
export { OrderStatus } from './ui/order-status/order-status';
export { OrderCardHeader } from './ui/order-card-header/order-card-header';
export { OrderCard } from './ui/order-card/order-card';
export { OrderPositionsList } from './ui/order-positions-list/order-positions-list';
export { OrderReadonlyItems } from './ui/order-readonly-items';
export { OrderProductCard } from './ui/order-product-card/order-product-card';
export { OrderServiceCard } from './ui/order-service-card/order-service-card';
