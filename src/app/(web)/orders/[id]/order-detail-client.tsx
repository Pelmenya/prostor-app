'use client';

import dynamic from 'next/dynamic';

// SSR отключён: auth-состояние читается из localStorage (только клиент).
// TODO(SSR-auth): вернуть SSR с prefetchQuery + HydrationBoundary
const OrderDetailPageDynamic = dynamic(
    () => import('@/views/order-detail').then((m) => ({ default: m.OrderDetailPage })),
    { ssr: false },
);

type TOrderDetailClientProps = {
    orderId: number;
};

export function OrderDetailClient({ orderId }: TOrderDetailClientProps) {
    return <OrderDetailPageDynamic orderId={orderId} />;
}
