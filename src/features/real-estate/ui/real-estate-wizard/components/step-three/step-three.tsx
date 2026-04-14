'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateRealEstate, useUpdateRealEstate } from '@/entities/real-estate';
import { installedEquipmentKeys } from '@/entities/installed-equipment';
import { Counter } from '@/shared/ui';
import { useRealEstateWizardStore } from '../../../../model/real-estate-wizard.store';
import { WizardStepLayout } from '../wizard-step-layout/wizard-step-layout';
import { Toilet } from './components/toilet';
import { Sink } from './components/sink';
import { Bath } from './components/bath';
import { WashingMachine } from './components/washing-machine';
import { DishWasher } from './components/dishwasher';
import { ShowerCabin } from './components/shower-cabin';
import type { TWizardStepProps } from '../../types/t-wizard-step-props';
import type { TCreateRealEstate } from '@/shared/model';

const INTAKE_POINTS = [
    { key: 'toilet', label: 'Унитаз', Icon: Toilet },
    { key: 'sink', label: 'Раковина', Icon: Sink },
    { key: 'bath', label: 'Ванная', Icon: Bath },
    { key: 'washingMachine', label: 'Стиралка', Icon: WashingMachine },
    { key: 'dishWasher', label: 'Посудомойка', Icon: DishWasher },
    { key: 'showerCabin', label: 'Душ', Icon: ShowerCabin },
] as const;

type TIntakeKey = (typeof INTAKE_POINTS)[number]['key'];

export function StepThree({ onPrev, editMode, id, onSuccess }: TWizardStepProps) {
    const router = useRouter();

    const address = useRealEstateWizardStore((s) => s.address);
    const coordinates = useRealEstateWizardStore((s) => s.coordinates);
    const geoData = useRealEstateWizardStore((s) => s.geoData);
    const suggestion = useRealEstateWizardStore((s) => s.suggestion);
    const activeType = useRealEstateWizardStore((s) => s.activeType);
    const residents = useRealEstateWizardStore((s) => s.residents);
    const activeSource = useRealEstateWizardStore((s) => s.activeSource);
    const depthWaterSource = useRealEstateWizardStore((s) => s.depthWaterSource);
    const waterIntakePoints = useRealEstateWizardStore((s) => s.waterIntakePoints);
    const setProgress = useRealEstateWizardStore((s) => s.setProgress);
    const reset = useRealEstateWizardStore((s) => s.reset);
    const increment = useRealEstateWizardStore((s) => s.incrementWaterIntakePoint);
    const decrement = useRealEstateWizardStore((s) => s.decrementWaterIntakePoint);

    const { toilet, sink, bath, washingMachine, dishWasher, showerCabin } = waterIntakePoints;
    const total = toilet + sink + bath + washingMachine + dishWasher + showerCabin;
    const hasAnyIntake = total > 0;

    const queryClient = useQueryClient();
    const createRealEstate = useCreateRealEstate();
    const updateRealEstate = useUpdateRealEstate();
    const isSaving = createRealEstate.isPending || updateRealEstate.isPending;

    useEffect(() => {
        setProgress(hasAnyIntake ? 100 : 80);
    }, [hasAnyIntake, setProgress]);

    const handleSave = async () => {
        const data: TCreateRealEstate = {
            address: address ?? undefined,
            geoData: geoData ?? undefined,
            suggestion: suggestion ?? undefined,
            coordinates: coordinates
                ? { type: 'Point', coordinates: [coordinates.longitude, coordinates.latitude] }
                : null,
            activeType,
            residents,
            activeSource,
            ...(depthWaterSource != null && { depthWaterSource }),
            waterIntakePoints,
        };

        try {
            if (editMode && id) {
                await updateRealEstate.mutateAsync({ id: Number(id), data });
                queryClient.invalidateQueries({
                    queryKey: installedEquipmentKeys.byRealEstate(Number(id)),
                });
                reset();
                router.back();
            } else {
                const created = await createRealEstate.mutateAsync(data);
                reset();
                if (onSuccess) {
                    onSuccess(created.id);
                } else {
                    router.push('/real-estate');
                }
            }
        } catch {
            // TODO: уведомление об ошибке
        }
    };

    const forwardLabel = isSaving ? (
        <span className="loading loading-spinner loading-xs" />
    ) : editMode ? (
        'Изменить'
    ) : (
        'Сохранить'
    );

    return (
        <WizardStepLayout
            onBack={onPrev!}
            onForward={handleSave}
            forwardLabel={forwardLabel}
            forwardDisabled={!hasAnyIntake || isSaving}
        >
            <div className="flex flex-col gap-3 p-4 bg-base-100 border border-base-300 rounded-2xl">
                <span className="text-sm font-semibold">Точки водоразбора</span>

                <div className="grid grid-cols-3 gap-2">
                    {INTAKE_POINTS.map(({ key, label, Icon }) => {
                        const count = waterIntakePoints[key as TIntakeKey];
                        const isActive = count > 0;
                        return (
                            <div
                                key={key}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors ${
                                    isActive
                                        ? 'border-primary bg-primary/5'
                                        : 'border-base-300 opacity-60'
                                }`}
                            >
                                <div className="size-6 flex items-center justify-center">
                                    <Icon />
                                </div>
                                <span className="text-xs text-center leading-tight">{label}</span>
                                <Counter
                                    count={count}
                                    onIncrement={() => increment(key as TIntakeKey)}
                                    onDecrement={() => decrement(key as TIntakeKey)}
                                    minCount={0}
                                    size="small"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </WizardStepLayout>
    );
}
