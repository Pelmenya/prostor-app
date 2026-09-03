'use client';

import dynamic from 'next/dynamic';

// SSR отключён: auth-состояние читается из localStorage (только клиент).
// TODO(SSR-auth): вернуть SSR с prefetchQuery + HydrationBoundary
export const AddressesClient = dynamic(
    () => import('@/views/addresses').then((m) => ({ default: m.AddressesPage })),
    { ssr: false },
);
