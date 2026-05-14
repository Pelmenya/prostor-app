import { EOrderStatus } from '../model/types/e-order-status';

export type TStatusTransition = {
    label: string;
    next: EOrderStatus;
    confirm: string;
};

export const MASTER_STATUS_TRANSITIONS: Partial<Record<EOrderStatus, TStatusTransition>> = {
    [EOrderStatus.PENDING]: {
        label: 'Принять заказ',
        next: EOrderStatus.CONFIRMED,
        confirm: 'Принять заказ и подтвердить выезд?',
    },
    [EOrderStatus.CONFIRMED]: {
        label: 'Начать работу',
        next: EOrderStatus.IN_PROGRESS,
        confirm: 'Отметить заказ как «В работе»?',
    },
    [EOrderStatus.IN_PROGRESS]: {
        label: 'Завершить заказ',
        next: EOrderStatus.COMPLETED,
        confirm: 'Отметить заказ как выполненный?',
    },
};

export function getMasterTransition(status: EOrderStatus): TStatusTransition | null {
    return MASTER_STATUS_TRANSITIONS[status] ?? null;
}
