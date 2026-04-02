'use client';

import { EOrderStatus } from '../../model/types/e-order-status';
import { STATUS_TEXT } from '../../lib/status-text';

type TOrderStatusProps = {
    status: EOrderStatus;
    isBase?: boolean;
};

export function OrderStatus({ status, isBase = false }: TOrderStatusProps) {
    let badgeClass = 'badge badge-xs';

    if (!isBase) {
        switch (status) {
            case EOrderStatus.PENDING:
                badgeClass += ' badge-primary';
                break;
            case EOrderStatus.CONFIRMED:
                badgeClass += ' badge-info badge-outline';
                break;
            case EOrderStatus.IN_PROGRESS:
                badgeClass += ' badge-primary badge-outline';
                break;
            case EOrderStatus.COMPLETED:
                badgeClass += ' badge-success badge-outline';
                break;
            case EOrderStatus.CANCELLED:
                badgeClass += ' badge-error badge-outline';
                break;
            default:
                badgeClass += ' badge-outline';
                break;
        }
    } else {
        badgeClass += ' opacity-30';
    }

    return <span className={badgeClass}>{STATUS_TEXT[status]}</span>;
}
