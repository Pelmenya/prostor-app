'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { PageContainer } from '@/shared/ui';
import { getSafeRedirect } from '@/shared/lib';
import { RealEstateWizard } from '@/features/real-estate';
import { useCheckoutStore } from '@/features/checkout';
import { AddressSearchSlot } from './address-search-slot';

export function AddAddressPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawReturnTo = searchParams.get('returnTo');
    const returnTo = rawReturnTo ? getSafeRedirect(rawReturnTo) : '/real-estate';

    const handleSuccess = (newId: number) => {
        if (returnTo === '/checkout') {
            useCheckoutStore.getState().setSelectedRealEstateId(newId);
        }
        router.replace(returnTo);
    };

    const handleCancel = () => router.replace(returnTo);

    return (
        <PageContainer>
            <RealEstateWizard
                addressSearchSlot={<AddressSearchSlot />}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />
        </PageContainer>
    );
}
