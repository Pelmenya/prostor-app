import { EOrderStatus } from '../model/types/e-order-status';

export const STATUS_TEXT: Record<EOrderStatus, string> = {
    [EOrderStatus.PENDING]: 'Новый',
    [EOrderStatus.CONFIRMED]: 'Подтвержден',
    [EOrderStatus.IN_PROGRESS]: 'Запланирован',
    [EOrderStatus.COMPLETED]: 'Выполнен',
    [EOrderStatus.CANCELLED]: 'Отменен',
};
