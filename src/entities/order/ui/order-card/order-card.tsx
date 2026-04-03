'use client';

import Link from 'next/link';
import type { TOrder } from '../../model/types/t-order';
import { CardWrapper } from '@/shared/ui';
import { OrderCardHeader } from '../order-card-header/order-card-header';
import { OrderPositionsList } from '../order-positions-list/order-positions-list';

type TOrderCardProps = {
    order: TOrder;
    imageUrls?: Record<string, string | undefined>;
    loadingIds?: Set<string>;
};

export function OrderCard({ order, imageUrls, loadingIds }: TOrderCardProps) {
    return (
        <li>
            <Link href={`/order/${order.id}`}>
                <CardWrapper className="flex-col gap-6 w-full">
                    <OrderCardHeader
                        title={String(order.id)}
                        date={order.createdAt}
                        status={order.status}
                    />
                    <OrderPositionsList
                        cartState={order.cartState}
                        imageUrls={imageUrls}
                        loadingIds={loadingIds}
                    />
                </CardWrapper>
            </Link>
        </li>
    );
}
