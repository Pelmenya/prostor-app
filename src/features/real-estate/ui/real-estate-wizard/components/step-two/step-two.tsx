'use client';

import { useEffect, type ReactNode } from 'react';
import { useRealEstateWizardStore } from '../../../../model/real-estate-wizard.store';
import { WizardStepLayout } from '../wizard-step-layout/wizard-step-layout';
import type { TWizardStepProps } from '../../types/t-wizard-step-props';

type TStepTwoProps = TWizardStepProps & {
    addressSearchSlot: ReactNode;
};

export function StepTwo({ onNext, onPrev, addressSearchSlot }: TStepTwoProps) {
    const address = useRealEstateWizardStore((s) => s.address);
    const coordinates = useRealEstateWizardStore((s) => s.coordinates);
    const setProgress = useRealEstateWizardStore((s) => s.setProgress);

    const hasAddress = Boolean(address && address.trim().length > 0);
    const hasCoords = Boolean(coordinates);
    const canProceed = hasAddress && hasCoords;

    useEffect(() => {
        setProgress(hasAddress ? 80 : 60);
    }, [hasAddress, setProgress]);

    return (
        <WizardStepLayout onBack={onPrev!} onForward={onNext!} forwardDisabled={!canProceed}>
            <div className="flex flex-col gap-3 p-4 bg-base-100 border border-base-300 rounded-2xl">
                <span className="text-sm font-semibold">Адрес</span>

                {!canProceed && (
                    <p className="text-xs text-base-content/50">
                        Начните вводить адрес и выберите вариант из списка. При необходимости
                        подкорректируйте маркер на карте.
                    </p>
                )}

                {addressSearchSlot}

                {hasAddress && !hasCoords && (
                    <p className="text-xs text-info">
                        Выберите адрес из подсказок, чтобы получить координаты.
                    </p>
                )}
            </div>
        </WizardStepLayout>
    );
}
