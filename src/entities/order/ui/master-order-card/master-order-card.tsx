import Link from 'next/link';
import { MapPinIcon, UserIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import type { TOrder } from '../../model/types/t-order';
import { CardWrapper } from '@/shared/ui';
import { OrderCardHeader } from '../order-card-header/order-card-header';
import { OrderPositionsList } from '../order-positions-list/order-positions-list';
import { formatDateRu } from '@/shared/lib';
import { masterOrderPath } from '@/shared/config';

type TMasterOrderCardProps = {
    order: TOrder;
    imageUrls?: Record<string, string | undefined>;
    loadingIds?: Set<string>;
};

export function MasterOrderCard({ order, imageUrls, loadingIds }: TMasterOrderCardProps) {
    const clientName = order.client
        ? [order.client.first_name, order.client.last_name].filter(Boolean).join(' ') || null
        : null;

    const hasItems = Object.keys(order.cartState.items ?? {}).length > 0;

    return (
        <Link href={masterOrderPath(order.id)}>
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
                        <div className="flex items-start gap-2">
                            <MapPinIcon className="size-4 shrink-0 text-base-content/40 mt-0.5" />
                            <span className="text-sm text-base-content/80 leading-snug">
                                {order.realEstate.address}
                            </span>
                        </div>
                    )}

                    {order.scheduledDate?.date && (
                        <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="size-4 shrink-0 text-base-content/40" />
                            <span className="text-xs text-base-content/50">
                                Дата выезда: {formatDateRu(order.scheduledDate.date)}
                            </span>
                        </div>
                    )}
                </div>

                {hasItems && (
                    <OrderPositionsList
                        cartState={order.cartState}
                        imageUrls={imageUrls}
                        loadingIds={loadingIds}
                    />
                )}
            </CardWrapper>
        </Link>
    );
}
