'use client';

import { PageContainer } from '@/shared/ui';
import { RealEstateWizard } from '@/features/real-estate';
import { AddressSearchSlot } from './address-search-slot';

export function AddAddressPage() {
    return (
        <PageContainer>
            <RealEstateWizard addressSearchSlot={<AddressSearchSlot />} />
        </PageContainer>
    );
}
