import { EOrderStatus } from '../model/types/e-order-status';

export const TAB_STATUS_PRESETS = {
    actual: [
        EOrderStatus.PENDING,
        EOrderStatus.CONFIRMED,
        EOrderStatus.IN_PROGRESS,
    ],
    completed: [
        EOrderStatus.COMPLETED,
        EOrderStatus.CANCELLED,
    ],
} as const;

export type TTabType = keyof typeof TAB_STATUS_PRESETS;
