'use client';

import dynamic from 'next/dynamic';

// SSR отключён: auth-состояние читается из localStorage (только клиент).
// TODO(SSR-auth): вернуть SSR с prefetchQuery + HydrationBoundary
const EditAddressPageDynamic = dynamic(
    () => import('@/views/addresses').then((m) => ({ default: m.EditAddressPage })),
    { ssr: false },
);

type TProps = { id: string };

export function EditAddressClient({ id }: TProps) {
    return <EditAddressPageDynamic id={id} />;
}
