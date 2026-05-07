'use client';

import { forwardRef, useState } from 'react';
import { LocationForm } from '@/features/master-location';
import type { TLocationFormHandle } from '@/features/master-location';
import { AddressSearchWithMap } from '@/features/address-search';
import type { TSuggestion, TFullGeoDataResponse, TCoordinates } from '@/features/address-search';
import type { TAccountService } from '@/entities/account-service';

type TLocationStepProps = {
    accountService: TAccountService | null;
};

export const LocationStep = forwardRef<TLocationFormHandle, TLocationStepProps>(
    function LocationStep({ accountService }, ref) {
        const [address, setAddress] = useState(accountService?.address ?? '');
        const [suggestion, setSuggestion] = useState<TSuggestion | null>(null);
        const [coordinates, setCoordinates] = useState<TCoordinates | null>(
            accountService?.coordinates
                ? {
                      latitude: accountService.coordinates.coordinates[1],
                      longitude: accountService.coordinates.coordinates[0],
                  }
                : null,
        );
        const [fullGeoData, setFullGeoData] = useState<TFullGeoDataResponse | null>(null);

        return (
            <div className="flex flex-col gap-6 max-w-lg mx-auto w-full">
                <h2 className="text-xl font-bold">Локация</h2>
                <p className="text-sm text-base-content/60">
                    Укажите ваш адрес базирования и склад по умолчанию.
                </p>

                <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">Адрес</p>
                    <AddressSearchWithMap
                        query={address}
                        coordinates={coordinates}
                        isViewCoordinates={false}
                        onQueryChange={setAddress}
                        onSelectAddress={setAddress}
                        onSelectSuggestion={setSuggestion}
                        onCoordinatesChange={(data) => {
                            setFullGeoData(data);
                            setCoordinates(data?.coordinates ?? null);
                        }}
                        onDragCoordinates={setCoordinates}
                    />
                </div>

                <LocationForm
                    ref={ref}
                    address={address}
                    suggestion={suggestion}
                    coordinates={coordinates}
                    geoData={fullGeoData}
                    initialDepartureBasis={accountService?.departureBasis}
                    initialStoreId={accountService?.storeId}
                    hideSubmit
                />
            </div>
        );
    },
);
