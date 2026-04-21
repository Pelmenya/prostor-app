'use client';

import dynamic from 'next/dynamic';

// TODO(NextAuth): после подключения NextAuth заменить ssr:false на серверный prefetch сессии
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
