'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import {
    useAccountService,
    useUpdateAccountService,
    EDepartureBasis,
} from '@/entities/account-service';
import { StoreSearch } from '@/entities/moy-sklad-store';
import { AddressSearchWithMap } from '@/features/address-search';
import type { TSuggestion, TFullGeoDataResponse, TCoordinates } from '@/features/address-search';

const DEPARTURE_OPTIONS: { value: EDepartureBasis; label: string; description: string }[] = [
    {
        value: EDepartureBasis.OWN_ADDRESS,
        label: 'От своего адреса',
        description: 'Маршрут строится от вашего адреса до клиента',
    },
    {
        value: EDepartureBasis.NEAREST_STORE,
        label: 'От ближайшего склада',
        description: 'Маршрут строится от ближайшего склада к клиенту',
    },
];

export type TLocationStepHandle = {
    submit: () => Promise<boolean>;
};

export const LocationStep = forwardRef<TLocationStepHandle>(function LocationStep(_, ref) {
    const { data: accountService } = useAccountService();
    const { mutateAsync } = useUpdateAccountService();

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
    const [departureBasis, setDepartureBasis] = useState<EDepartureBasis>(
        accountService?.departureBasis ?? EDepartureBasis.OWN_ADDRESS,
    );
    const [storeId, setStoreId] = useState<string | null>(accountService?.storeId ?? null);

    useImperativeHandle(ref, () => ({
        submit: async () => {
            if (!address.trim()) return false;
            try {
                await mutateAsync({
                    address,
                    suggestion: suggestion ?? undefined,
                    geoData: (fullGeoData as Record<string, unknown>) ?? undefined,
                    coordinates: coordinates
                        ? {
                              type: 'Point',
                              coordinates: [coordinates.longitude, coordinates.latitude],
                          }
                        : undefined,
                    departureBasis,
                    storeId,
                });
                return true;
            } catch {
                return false;
            }
        },
    }));

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

            <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Склад по умолчанию</p>
                <StoreSearch value={storeId} onChange={setStoreId} />
            </div>

            <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">Откуда считать выезд</p>
                {DEPARTURE_OPTIONS.map((option) => (
                    <label
                        key={option.value}
                        className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${
                            departureBasis === option.value
                                ? 'border-primary bg-primary/5'
                                : 'border-base-300 bg-base-100'
                        }`}
                    >
                        <input
                            type="radio"
                            className="radio radio-primary mt-0.5"
                            name="departureBasis"
                            value={option.value}
                            checked={departureBasis === option.value}
                            onChange={() => setDepartureBasis(option.value)}
                        />
                        <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-sm">{option.label}</span>
                            <span className="text-xs text-base-content/60">
                                {option.description}
                            </span>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
});
