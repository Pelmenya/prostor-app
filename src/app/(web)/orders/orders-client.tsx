'use client';

import dynamic from 'next/dynamic';

// SSR отключён: auth-состояние читается из localStorage (только клиент).
// TODO(SSR-auth): вернуть SSR с prefetchQuery + HydrationBoundary
export const OrdersClient = dynamic(
    () => import('@/views/orders').then((m) => ({ default: m.OrdersPage })),
    { ssr: false },
);
