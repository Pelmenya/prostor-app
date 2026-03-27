'use client';

import { PageContainer } from '@/shared/ui';
import { RealEstateWizard, useRealEstateWizardStore } from '@/features/real-estate';
import { AddressSearchWithMap } from '@/features/address-search';

function AddressSearchSlot() {
    const address = useRealEstateWizardStore((s) => s.address);
    const coordinates = useRealEstateWizardStore((s) => s.coordinates);
    const setAddress = useRealEstateWizardStore((s) => s.setAddress);
    const setCoordinates = useRealEstateWizardStore((s) => s.setCoordinates);
    const setGeoData = useRealEstateWizardStore((s) => s.setGeoData);
    const setSuggestion = useRealEstateWizardStore((s) => s.setSuggestion);

    return (
        <AddressSearchWithMap
            query={address || ''}
            selectedAddress={address}
            coordinates={coordinates}
            isViewCoordinates={false}
            zoom={17}
            onQueryChange={(q) => setAddress(q)}
            onSelectAddress={(addr) => setAddress(addr)}
            onSelectSuggestion={(suggestion) =>
                setSuggestion(suggestion ? { ...suggestion } : null)
            }
            onCoordinatesChange={(fullGeoData) => {
                setCoordinates(fullGeoData?.coordinates ?? null);
                setGeoData(fullGeoData?.geoData ?? null);
            }}
        />
    );
}

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
