'use client';

import { forwardRef } from 'react';
import { VehicleForm } from '@/features/master-vehicle';
import type { TVehicleFormHandle } from '@/features/master-vehicle';
import type { TAccountService } from '@/entities/account-service';

type TVehicleStepProps = {
    accountService: TAccountService | null;
};

export const VehicleStep = forwardRef<TVehicleFormHandle, TVehicleStepProps>(function VehicleStep(
    { accountService },
    ref,
) {
    return (
        <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
            <h2 className="text-xl font-bold">Автомобиль</h2>
            <p className="text-sm text-base-content/60">
                Укажите данные вашего рабочего автомобиля.
            </p>
            <VehicleForm ref={ref} initialData={accountService} hideSubmit />
        </div>
    );
});
