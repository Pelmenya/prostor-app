'use client';

import { forwardRef } from 'react';
import { ZoneSelector } from '@/features/master-service-area';
import type { TZoneSelectorHandle } from '@/features/master-service-area';
import type { TAccountService } from '@/entities/account-service';

type TServiceAreasStepProps = {
    accountService: TAccountService | null;
};

export const ServiceAreasStep = forwardRef<TZoneSelectorHandle, TServiceAreasStepProps>(
    function ServiceAreasStep({ accountService }, ref) {
        const center = accountService?.coordinates
            ? {
                  latitude: accountService.coordinates.coordinates[1],
                  longitude: accountService.coordinates.coordinates[0],
              }
            : undefined;

        return (
            <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
                <h2 className="text-xl font-bold">Зоны обслуживания</h2>
                <p className="text-sm text-base-content/60">
                    Выберите районы, в которых вы готовы работать.
                </p>
                <ZoneSelector ref={ref} center={center} hideSubmit />
            </div>
        );
    },
);
