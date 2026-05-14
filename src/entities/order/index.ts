// API
export {
    useCreateOrder,
    useGetOrders,
    useGetOrdersCount,
    useGetOrderById,
    useUpdateOrderStatus,
    orderKeys,
} from './api/order.api';
export type {
    TOrdersQueryFilters,
    TOrdersQueryOptions,
    TOrdersCountFilters,
    TOrdersQueryParams,
    TOrdersCountParams,
} from './api/order.api';

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
// Lib
export { STATUS_STEP, STATUS_LABEL } from './lib/status-config';
export { getMasterTransition } from './lib/order-status-machine';
export type { TStatusTransition } from './lib/order-status-machine';
export { SERVICE_GROUPS } from './lib/service-groups';
export { getServiceInfo } from './lib/get-service-info';
export { getServicesForCategory } from './lib/get-services-for-category';
export { groupOrderPositions } from './lib/group-order-positions';

// UI
export { OrderStatus } from './ui/order-status/order-status';
export { OrderCardHeader } from './ui/order-card-header/order-card-header';
export { OrderCard } from './ui/order-card/order-card';
export { MasterOrderCard } from './ui/master-order-card/master-order-card';
export { OrderPositionsList } from './ui/order-positions-list/order-positions-list';
export { OrderProductCard } from './ui/order-product-card/order-product-card';
export { OrderServiceCard } from './ui/order-service-card/order-service-card';
