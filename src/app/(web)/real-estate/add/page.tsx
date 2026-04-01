'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AddAddressPage } from '@/views/addresses';
import { useCheckoutStore } from '@/features/checkout';

export default function AddRealEstateRoute() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo');

    const handleSuccess = returnTo
        ? (newId: number) => {
              if (returnTo === '/checkout') {
                  useCheckoutStore.getState().setSelectedRealEstateId(newId);
              }
              router.replace(returnTo);
          }
        : undefined;

    const handleCancel = returnTo ? () => router.replace(returnTo) : undefined;

    return <AddAddressPage onSuccess={handleSuccess} onCancel={handleCancel} />;
}
