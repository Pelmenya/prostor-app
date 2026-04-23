'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAccountService } from '@/entities/account-service';
import { LocationForm } from '@/features/master-location';
import { AddressSearchWithMap } from '@/features/address-search';
import type { TSuggestion, TFullGeoDataResponse, TCoordinates } from '@/features/address-search';
import { PageContainer, PageTitle, PageSpinner, QueryBoundary } from '@/shared/ui';
import { useAuth } from '@/shared/lib/platform';

export function MasterLocationPage() {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <PageSpinner />;
    return (
        <QueryBoundary errorMessage="Ошибка загрузки локации">
            <MasterLocationContent />
        </QueryBoundary>
    );
}

function MasterLocationContent() {
    const router = useRouter();
    const { data: accountService } = useAccountService();

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
        <PageContainer bg="bg-base-200">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="btn btn-ghost btn-sm btn-circle"
                    aria-label="Назад"
                >
                    <ArrowLeftIcon className="size-5" />
                </button>
                <PageTitle>Ваша локация</PageTitle>
            </div>
            <div className="flex flex-col gap-6 max-w-lg mx-auto py-4">
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
                    address={address}
                    suggestion={suggestion}
                    coordinates={coordinates}
                    geoData={fullGeoData as Record<string, unknown> | null}
                    initialDepartureBasis={accountService?.departureBasis}
                    initialStoreId={accountService?.storeId}
                    onSuccess={() => router.back()}
                />
            </div>
        </PageContainer>
    );
}
