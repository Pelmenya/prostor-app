'use client';

import { FC, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { StepOne } from './components/step-one/step-one';
import { StepTwo } from './components/step-two/step-two';
import { StepThree } from './components/step-three/step-three';
import { WizardStepper } from './components/wizard-stepper/wizard-stepper';
import { useRealEstate } from '@/entities/real-estate';
import { useRealEstateWizardStore } from '../../model/real-estate-wizard.store';
import { PageTitle } from '@/shared/ui';

type TRealEstateWizardProps = {
    id?: string;
    addressSearchSlot?: ReactNode;
    onSuccess?: (newId: number) => void;
    onCancel?: () => void;
};

export const RealEstateWizard: FC<TRealEstateWizardProps> = ({
    id,
    addressSearchSlot,
    onSuccess,
    onCancel,
}) => {
    const [step, setStep] = useState(1);
    const router = useRouter();

    const editMode = Boolean(id);
    const { data, isLoading, error } = useRealEstate(id ? Number(id) : undefined);

    const reset = useRealEstateWizardStore((s) => s.reset);
    const setAddress = useRealEstateWizardStore((s) => s.setAddress);
    const setCoordinates = useRealEstateWizardStore((s) => s.setCoordinates);
    const setGeoData = useRealEstateWizardStore((s) => s.setGeoData);
    const setSuggestion = useRealEstateWizardStore((s) => s.setSuggestion);
    const setActiveType = useRealEstateWizardStore((s) => s.setActiveType);
    const setResidents = useRealEstateWizardStore((s) => s.setResidents);
    const setActiveSource = useRealEstateWizardStore((s) => s.setActiveSource);
    const setWaterIntakePoints = useRealEstateWizardStore((s) => s.setWaterIntakePoints);
    const setDepthWaterSource = useRealEstateWizardStore((s) => s.setDepthWaterSource);

    useEffect(() => {
        if (editMode && data) {
            reset();
            setAddress(data.address ?? null);
            setCoordinates(
                data.coordinates
                    ? {
                          latitude: data.coordinates.coordinates[1],
                          longitude: data.coordinates.coordinates[0],
                      }
                    : null,
            );
            setGeoData(data.geoData);
            setSuggestion(data.suggestion);
            setActiveType(data.activeType);
            setResidents(data.residents);
            setActiveSource(data.activeSource);
            setWaterIntakePoints(data.waterIntakePoints);
            if (data.depthWaterSource != null) {
                setDepthWaterSource(data.depthWaterSource);
            }
        }
        if (!editMode) {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Zustand setters are stable by design
    }, [editMode, data, id]);

    const handleCancel = onCancel ?? (() => router.push('/real-estate'));

    if (editMode && isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <span className="loading loading-spinner loading-xs text-primary" />
            </div>
        );
    }

    if (editMode && error) {
        return <div className="alert alert-error text-sm">Ошибка загрузки объекта</div>;
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <PageTitle>{editMode ? 'Редактирование объекта' : 'Новый объект'}</PageTitle>
            <div className="flex flex-col gap-4 w-full max-w-lg mx-auto">
                <WizardStepper current={step} />
                {step === 1 && (
                    <StepOne
                        editMode={editMode}
                        id={id}
                        onNext={() => setStep(2)}
                        onCancel={handleCancel}
                    />
                )}
                {step === 2 && (
                    <StepTwo
                        editMode={editMode}
                        id={id}
                        onPrev={() => setStep(1)}
                        onNext={() => setStep(3)}
                        onCancel={handleCancel}
                        addressSearchSlot={addressSearchSlot}
                    />
                )}
                {step === 3 && (
                    <StepThree
                        editMode={editMode}
                        id={id}
                        onPrev={() => setStep(2)}
                        onCancel={handleCancel}
                        onSuccess={onSuccess}
                    />
                )}
            </div>
        </div>
    );
};
