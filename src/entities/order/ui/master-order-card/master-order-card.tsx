import Link from 'next/link';
import { MapPinIcon, UserIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import type { TOrder } from '../../model/types/t-order';
import { EOrderStatus } from '../../model/types/e-order-status';
import { calcReward } from '../../lib/calc-reward';
import { CardWrapper } from '@/shared/ui';
import { OrderCardHeader } from '../order-card-header/order-card-header';
import { formatDateRu } from '@/shared/lib';

type TMasterOrderCardProps = {
    order: TOrder;
};

export function MasterOrderCard({ order }: TMasterOrderCardProps) {
    const displayDate = order.scheduledDate?.date ?? order.createdAt;
    const dateLabel = order.scheduledDate?.date ? 'Дата выезда' : 'Создан';
    const clientName = order.client
        ? `${order.client.first_name} ${order.client.last_name}`.trim()
        : null;
    const isCancelled = order.status === EOrderStatus.CANCELLED;
    const reward = isCancelled ? 0 : calcReward(order);

    return (
        <Link href={`/master/orders/${order.id}`}>
            <CardWrapper className="flex-col gap-3 w-full">
                <OrderCardHeader
                    title={String(order.id)}
                    date={order.createdAt}
                    status={order.status}
                />

                <div className="flex flex-col gap-2 w-full">
                    {clientName && (
                        <div className="flex items-center gap-2">
                            <UserIcon className="size-4 shrink-0 text-base-content/40" />
                            <span className="text-sm text-base-content/80">{clientName}</span>
                        </div>
                    )}

                    {order.realEstate?.address && (
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                                <MapPinIcon className="size-4 shrink-0 text-base-content/40 mt-0.5" />
                                <span className="text-sm text-base-content/80 leading-snug">
                                    {order.realEstate.address}
                                </span>
                            </div>
                            {reward > 0 && (
                                <span className="text-success font-medium text-sm whitespace-nowrap shrink-0">
                                    + {reward.toLocaleString('ru-RU')} ₽
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="size-4 shrink-0 text-base-content/40" />
                        <span className="text-xs text-base-content/50">
                            {dateLabel}: {formatDateRu(displayDate)}
                        </span>
                    </div>
                </div>
            </CardWrapper>
        </Link>
    );
}
