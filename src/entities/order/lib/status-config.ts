import { EOrderStatus } from '../model/types/e-order-status';

export const STATUS_STEP: Record<EOrderStatus, number> = {
    [EOrderStatus.PENDING]: 1,
    [EOrderStatus.CONFIRMED]: 2,
    [EOrderStatus.IN_PROGRESS]: 3,
    [EOrderStatus.COMPLETED]: 4,
    [EOrderStatus.CANCELLED]: 0,
};

export const STATUS_LABEL: Record<EOrderStatus, { text: string; className: string }> = {
    [EOrderStatus.PENDING]: { text: 'Создан', className: '' },
    [EOrderStatus.CONFIRMED]: { text: 'Подтверждён', className: '' },
    [EOrderStatus.IN_PROGRESS]: { text: 'Запланирован', className: '' },
    [EOrderStatus.COMPLETED]: { text: 'Выполнен', className: 'text-primary' },
    [EOrderStatus.CANCELLED]: { text: 'Отменен', className: 'text-error' },
};
