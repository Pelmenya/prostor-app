'use client';

import dynamic from 'next/dynamic';

// SSR отключён: auth-состояние читается из localStorage (только клиент).
// TODO(NextAuth): после реализации NextAuth вернуть SSR с prefetchQuery + HydrationBoundary
export const CheckoutClient = dynamic(
    () => import('@/views/checkout').then((m) => ({ default: m.CheckoutPage })),
    { ssr: false },
);
