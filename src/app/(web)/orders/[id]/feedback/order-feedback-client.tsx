'use client';

import dynamic from 'next/dynamic';

const OrderFeedbackPageDynamic = dynamic(
    () => import('@/views/order-feedback').then((m) => ({ default: m.OrderFeedbackPage })),
    { ssr: false },
);

type TOrderFeedbackClientProps = {
    orderId: number;
};

export function OrderFeedbackClient({ orderId }: TOrderFeedbackClientProps) {
    return <OrderFeedbackPageDynamic orderId={orderId} />;
}
