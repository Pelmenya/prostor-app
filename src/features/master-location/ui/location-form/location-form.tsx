'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { EDepartureBasis, useUpdateAccountService } from '@/entities/account-service';
import { StoreSearch } from '@/entities/moy-sklad-store';

export const DEPARTURE_OPTIONS: { value: EDepartureBasis; label: string; description: string }[] = [
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

export type TLocationFormHandle = {
    submit: () => Promise<boolean>;
};

type TLocationFormProps = {
    address: string;
    suggestion: { machine: string; sign: string; value: string; zip: string } | null;
    coordinates: { latitude: number; longitude: number } | null;
    geoData: unknown;
    initialDepartureBasis?: EDepartureBasis | null;
    initialStoreId?: string | null;
    hideSubmit?: boolean;
    onSuccess?: () => void;
};

export const LocationForm = forwardRef<TLocationFormHandle, TLocationFormProps>(
    function LocationForm(
        {
            address,
            suggestion,
            coordinates,
            geoData,
            initialDepartureBasis,
            initialStoreId,
            hideSubmit = false,
            onSuccess,
        },
        ref,
    ) {
        const { mutate, mutateAsync, isPending, error } = useUpdateAccountService();

        const [departureBasis, setDepartureBasis] = useState<EDepartureBasis>(
            initialDepartureBasis ?? EDepartureBasis.OWN_ADDRESS,
        );
        const [storeId, setStoreId] = useState<string | null>(initialStoreId ?? null);

        useImperativeHandle(ref, () => ({
            submit: async () => {
                if (!address.trim()) return false;
                try {
                    await mutateAsync({
                        address,
                        suggestion: suggestion ?? undefined,
                        geoData: (geoData as Record<string, unknown>) ?? undefined,
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

        function handleSubmit(e: React.FormEvent) {
            e.preventDefault();
            if (!address.trim()) return;

            mutate(
                {
                    address,
                    suggestion: suggestion ?? undefined,
                    geoData: (geoData as Record<string, unknown>) ?? undefined,
                    coordinates: coordinates
                        ? {
                              type: 'Point',
                              coordinates: [coordinates.longitude, coordinates.latitude],
                          }
                        : undefined,
                    departureBasis,
                    storeId,
                },
                { onSuccess },
            );
        }

        return (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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

                {error && (
                    <p className="text-error text-sm">Не удалось сохранить. Попробуйте ещё раз.</p>
                )}

                {!hideSubmit && (
                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={!address.trim() || isPending}
                    >
                        {isPending ? (
                            <span className="loading loading-spinner loading-sm" />
                        ) : (
                            'Сохранить'
                        )}
                    </button>
                )}
            </form>
        );
    },
);
