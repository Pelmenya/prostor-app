'use client';

import Link from 'next/link';
import type { TOrder } from '../../model/types/t-order';
import { CardWrapper } from '@/shared/ui';
import { useProductThumbnails } from '@/entities/product';
import { OrderCardHeader } from '../order-card-header/order-card-header';
import { OrderPositionsList } from '../order-positions-list/order-positions-list';

type TOrderCardProps = {
    order: TOrder;
};

export function OrderCard({ order }: TOrderCardProps) {
    const productIds = Object.keys(order.cartState?.items ?? {});
    const { imageUrls, loadingIds } = useProductThumbnails(productIds);

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
