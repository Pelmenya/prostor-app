import { cn } from '@/shared/lib';
import { EOrderStatus } from '../../model/types/e-order-status';
import { STATUS_TEXT } from '../../lib/status-text';

const STATUS_BADGE: Record<EOrderStatus, string> = {
    [EOrderStatus.PENDING]: 'badge-primary',
    [EOrderStatus.CONFIRMED]: 'badge-info badge-outline',
    [EOrderStatus.IN_PROGRESS]: 'badge-primary badge-outline',
    [EOrderStatus.COMPLETED]: 'badge-success badge-outline',
    [EOrderStatus.CANCELLED]: 'badge-error badge-outline',
};

type TOrderStatusProps = {
    status: EOrderStatus;
    isBase?: boolean;
};

export function OrderStatus({ status, isBase = false }: TOrderStatusProps) {
    return (
        <span className={cn('badge badge-xs', isBase ? 'opacity-30' : STATUS_BADGE[status])}>
            {STATUS_TEXT[status]}
        </span>
    );
}
