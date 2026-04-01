'use client';

import { PageContainer } from '@/shared/ui';
import { RealEstateWizard } from '@/features/real-estate';
import { AddressSearchSlot } from './address-search-slot';

type TAddAddressPageProps = {
    onSuccess?: (newId: number) => void;
};

export function AddAddressPage({ onSuccess }: TAddAddressPageProps) {
    return (
        <PageContainer>
            <RealEstateWizard addressSearchSlot={<AddressSearchSlot />} onSuccess={onSuccess} />
        </PageContainer>
    );
}
