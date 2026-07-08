'use client';

import dynamic from 'next/dynamic';

// SSR отключён: auth-состояние читается из localStorage (только клиент).
// TODO(NextAuth): после реализации NextAuth вернуть SSR с prefetchQuery + HydrationBoundary
const AddressDetailPageDynamic = dynamic(
    () => import('@/views/addresses').then((m) => ({ default: m.AddressDetailPage })),
    { ssr: false },
);

type TProps = { id: number };

export function AddressDetailClient({ id }: TProps) {
    return <AddressDetailPageDynamic id={id} />;
}
