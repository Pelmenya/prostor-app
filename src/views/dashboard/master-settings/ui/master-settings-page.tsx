'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccountService } from '@/entities/account-service';
import { QueryBoundary } from '@/shared/ui';
import { ServiceSettingsWizard } from '@/features/service-settings';
import { ProfileStep } from './steps/profile-step';
import { LocationStep } from './steps/location-step';
import { VehicleStep } from './steps/vehicle-step';
import { ServiceAreasStep } from './steps/service-areas-step';
import { ScheduleStep } from './steps/schedule-step';
import type { TProfileStepHandle } from './steps/profile-step';
import type { TLocationStepHandle } from './steps/location-step';
import type { TVehicleStepHandle } from './steps/vehicle-step';

export function MasterSettingsPage() {
    return (
        <QueryBoundary errorMessage="Ошибка загрузки настроек">
            <MasterSettingsContent />
        </QueryBoundary>
    );
}

function MasterSettingsContent() {
    const router = useRouter();
    const { data: accountService } = useAccountService();

    const currentStep = accountService?.serviceSetup?.currentStep ?? 1;
    const isCompleted = accountService?.serviceSetup?.completed ?? false;

    const profileRef = useRef<TProfileStepHandle>(null);
    const locationRef = useRef<TLocationStepHandle>(null);
    const vehicleRef = useRef<TVehicleStepHandle>(null);

    useEffect(() => {
        if (isCompleted) {
            router.replace('/master');
        }
    }, [isCompleted, router]);

    async function handleBeforeNext(): Promise<boolean> {
        if (currentStep === 1) return (await profileRef.current?.submit()) ?? false;
        if (currentStep === 2) return (await locationRef.current?.submit()) ?? false;
        if (currentStep === 3) return (await vehicleRef.current?.submit()) ?? false;
        return true;
    }

    if (isCompleted) return null;

    function renderStep() {
        switch (currentStep) {
            case 1:
                return <ProfileStep ref={profileRef} />;
            case 2:
                return <LocationStep ref={locationRef} />;
            case 3:
                return <VehicleStep ref={vehicleRef} />;
            case 4:
                return <ServiceAreasStep />;
            case 5:
                return <ScheduleStep />;
            default:
                return <ProfileStep ref={profileRef} />;
        }
    }

    return (
        <ServiceSettingsWizard currentStep={currentStep} onBeforeNext={handleBeforeNext}>
            {renderStep()}
        </ServiceSettingsWizard>
    );
}
