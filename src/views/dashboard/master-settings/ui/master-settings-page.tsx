'use client';

import { useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccountService } from '@/entities/account-service';
import { QueryBoundary } from '@/shared/ui';
import { ServiceSettingsWizard } from '@/features/service-settings';
import { ProfileStep } from './steps/profile-step';
import { LocationStep } from './steps/location-step';
import { VehicleStep } from './steps/vehicle-step';
import { ServiceAreasStep } from './steps/service-areas-step';
import { ScheduleStep } from './steps/schedule-step';
import type { TProfileFormHandle } from '@/entities/user';
import type { TLocationFormHandle } from '@/features/master-location';
import type { TVehicleFormHandle } from '@/features/master-vehicle';
import type { TZoneSelectorHandle } from '@/features/master-service-area';
import type { TWeeklyScheduleFormHandle } from '@/features/master-schedule';

const TOTAL_STEPS = 5;

export function MasterSettingsPage() {
    return (
        <QueryBoundary errorMessage="Ошибка загрузки настроек">
            <MasterSettingsContent />
        </QueryBoundary>
    );
}

function MasterSettingsContent() {
    const searchParams = useSearchParams();
    const currentStep = Math.max(
        1,
        Math.min(TOTAL_STEPS, parseInt(searchParams.get('step') ?? '1', 10)),
    );

    const { data: accountService } = useAccountService();

    const profileRef = useRef<TProfileFormHandle>(null);
    const locationRef = useRef<TLocationFormHandle>(null);
    const vehicleRef = useRef<TVehicleFormHandle>(null);
    const zonesRef = useRef<TZoneSelectorHandle>(null);
    const scheduleRef = useRef<TWeeklyScheduleFormHandle>(null);

    async function handleBeforeNext(): Promise<boolean> {
        if (currentStep === 1) return (await profileRef.current?.submit()) ?? false;
        if (currentStep === 2) return (await locationRef.current?.submit()) ?? false;
        if (currentStep === 3) return (await vehicleRef.current?.submit()) ?? false;
        if (currentStep === 4) return (await zonesRef.current?.submit()) ?? false;
        if (currentStep === 5) return (await scheduleRef.current?.submit()) ?? false;
        return true;
    }

    function renderStep() {
        switch (currentStep) {
            case 1:
                return <ProfileStep ref={profileRef} />;
            case 2:
                return <LocationStep ref={locationRef} accountService={accountService} />;
            case 3:
                return <VehicleStep ref={vehicleRef} accountService={accountService} />;
            case 4:
                return <ServiceAreasStep ref={zonesRef} accountService={accountService} />;
            case 5:
                return <ScheduleStep ref={scheduleRef} />;
            default:
                return <ProfileStep ref={profileRef} />;
        }
    }

    return (
        <ServiceSettingsWizard onBeforeNext={handleBeforeNext}>
            {renderStep()}
        </ServiceSettingsWizard>
    );
}
