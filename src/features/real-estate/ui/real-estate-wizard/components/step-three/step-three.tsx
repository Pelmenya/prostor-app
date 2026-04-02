'use client';

import { FC, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateRealEstate, useUpdateRealEstate } from '@/entities/real-estate';
import { useRealEstateWizardStore } from '../../../../model/real-estate-wizard.store';
import { WaterIntakePoint } from './components/water-intake-point/water-intake-point';
import { Toilet } from './components/toilet';
import { Sink } from './components/sink';
import { Bath } from './components/bath';
import { WashingMachine } from './components/washing-machine';
import { DishWasher } from './components/dishwasher';
import { ShowerCabin } from './components/shower-cabin';
import type { TWizardStepProps } from '../../types/t-wizard-step-props';
import type { TCreateRealEstate } from '@/shared/model';

export const StepThree: FC<TWizardStepProps> = ({ onPrev, editMode, id, onCancel, onSuccess }) => {
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

    const createRealEstate = useCreateRealEstate();
    const updateRealEstate = useUpdateRealEstate();

    const hasAnyIntake = toilet + sink + bath + washingMachine + dishWasher + showerCabin > 0;

    useEffect(() => {
        setProgress(hasAnyIntake ? 100 : 80);
    }, [hasAnyIntake, setProgress]);

    const handleSave = async () => {
        const data: TCreateRealEstate = {
            address: address ?? undefined,
            geoData: geoData ?? undefined,
            suggestion: suggestion ?? undefined,
            coordinates: coordinates
                ? {
                      type: 'Point',
                      coordinates: [coordinates.longitude, coordinates.latitude],
                  }
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
            // TODO: уведомление об ошибке (когда определимся с решением)
        }
    };

    const isSaving = createRealEstate.isPending || updateRealEstate.isPending;

    return (
        <div className="size-full flex flex-col justify-between gap-4 lg:gap-6">
            <h2 className="text-lg font-bold">
                {editMode ? 'Редактирование объекта' : 'Добавление объекта'} — Шаг 3
            </h2>
            <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Точки водоразбора</h3>
                <WaterIntakePoint
                    name="Унитаз или биде"
                    count={toilet}
                    onIncrement={() => increment('toilet')}
                    onDecrement={() => decrement('toilet')}
                >
                    <Toilet />
                </WaterIntakePoint>
                <WaterIntakePoint
                    name="Раковина"
                    count={sink}
                    onIncrement={() => increment('sink')}
                    onDecrement={() => decrement('sink')}
                >
                    <Sink />
                </WaterIntakePoint>
                <WaterIntakePoint
                    name="Ванная"
                    count={bath}
                    onIncrement={() => increment('bath')}
                    onDecrement={() => decrement('bath')}
                >
                    <Bath />
                </WaterIntakePoint>
                <WaterIntakePoint
                    name="Стиральная машина"
                    count={washingMachine}
                    onIncrement={() => increment('washingMachine')}
                    onDecrement={() => decrement('washingMachine')}
                >
                    <WashingMachine />
                </WaterIntakePoint>
                <WaterIntakePoint
                    name="Посудомоечная машина"
                    count={dishWasher}
                    onIncrement={() => increment('dishWasher')}
                    onDecrement={() => decrement('dishWasher')}
                >
                    <DishWasher />
                </WaterIntakePoint>
                <WaterIntakePoint
                    name="Душевая кабина"
                    count={showerCabin}
                    onIncrement={() => increment('showerCabin')}
                    onDecrement={() => decrement('showerCabin')}
                >
                    <ShowerCabin />
                </WaterIntakePoint>
            </div>
            <div className="w-full flex items-center justify-center">
                <div className="join">
                    <button className="join-item btn btn-primary min-w-[30vw]" onClick={onPrev}>
                        Назад
                    </button>
                    <button className="join-item btn btn-secondary min-w-[30vw]" onClick={onCancel}>
                        Отмена
                    </button>
                    <button
                        className="join-item btn btn-primary min-w-[30vw]"
                        onClick={handleSave}
                        disabled={!hasAnyIntake || isSaving}
                    >
                        {isSaving ? (
                            <span className="loading loading-spinner loading-xs" />
                        ) : editMode ? (
                            'Изменить'
                        ) : (
                            'Сохранить'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
