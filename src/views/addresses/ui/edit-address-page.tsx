'use client';

import { PageContainer } from '@/shared/ui';
import { RealEstateWizard } from '@/features/real-estate';
import { AddressSearchSlot } from './address-search-slot';

type TEditAddressPageProps = {
    id: string;
};

export function EditAddressPage({ id }: TEditAddressPageProps) {
    return (
        <PageContainer>
            <RealEstateWizard id={id} addressSearchSlot={<AddressSearchSlot />} />
        </PageContainer>
    );
}
