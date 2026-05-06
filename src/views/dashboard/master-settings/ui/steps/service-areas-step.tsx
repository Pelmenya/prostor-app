'use client';

import { forwardRef, useImperativeHandle } from 'react';
import { useAccountService } from '@/entities/account-service';
import { ZoneSelector } from '@/features/master-service-area';

export type TServiceAreasStepHandle = {
    submit: () => Promise<boolean>;
};

export const ServiceAreasStep = forwardRef<TServiceAreasStepHandle>(
    function ServiceAreasStep(_, ref) {
        const { data: accountService } = useAccountService();

        const center = accountService?.coordinates
            ? {
                  latitude: accountService.coordinates.coordinates[1],
                  longitude: accountService.coordinates.coordinates[0],
              }
            : undefined;

        useImperativeHandle(ref, () => ({
            submit: async () => true,
        }));

        return (
            <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
                <h2 className="text-xl font-bold">Зоны обслуживания</h2>
                <p className="text-sm text-base-content/60">
                    Выберите районы, в которых вы готовы работать. Можно изменить позже.
                </p>
                <ZoneSelector center={center} />
            </div>
        );
    },
);
