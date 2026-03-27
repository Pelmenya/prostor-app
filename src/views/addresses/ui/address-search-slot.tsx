'use client';

import { AddressSearchWithMap } from '@/features/address-search';
import { useRealEstateWizardStore } from '@/features/real-estate';

export function AddressSearchSlot() {
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
