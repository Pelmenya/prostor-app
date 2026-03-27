'use client';

import { FC } from 'react';
import { ToggleRealEstateButtons } from './components/toggle-real-estate-buttons/toggle-real-estate-buttons';
import { PeopleSlider } from './components/people-slider/people-slider';
import { WaterSource } from './components/water-source/water-source';
import { RangeSlider } from '@/shared/ui';
import { useRealEstateWizardStore } from '../../../../model/real-estate-wizard.store';
import type { TWizardStepProps } from '../../types/t-wizard-step-props';
import type { TRealEstateSourceWater } from '@/shared/model';

export const StepOne: FC<TWizardStepProps> = ({ onNext, editMode, onCancel }) => {
    const activeType = useRealEstateWizardStore((s) => s.activeType);
    const residents = useRealEstateWizardStore((s) => s.residents);
    const activeSource = useRealEstateWizardStore((s) => s.activeSource);
    const depthWaterSource = useRealEstateWizardStore((s) => s.depthWaterSource);

    const setActiveType = useRealEstateWizardStore((s) => s.setActiveType);
    const setResidents = useRealEstateWizardStore((s) => s.setResidents);
    const setActiveSource = useRealEstateWizardStore((s) => s.setActiveSource);
    const setDepthWaterSource = useRealEstateWizardStore((s) => s.setDepthWaterSource);

    const handleSourceChange = (source: TRealEstateSourceWater) => {
        setActiveSource(source);
        if (source === 'well' || source === 'borehole') {
            if (depthWaterSource == null) {
                setDepthWaterSource(5);
            }
        } else {
            setDepthWaterSource(null);
        }
    };

    return (
        <div className="size-full flex flex-col items-center gap-4 lg:gap-6">
            <h2 className="text-lg font-bold w-full">
                {editMode ? 'Редактирование объекта' : 'Добавление объекта'} — Шаг 1
            </h2>
            <div className="size-full flex flex-col gap-4">
                <ToggleRealEstateButtons active={activeType} onToggle={setActiveType} />
                <PeopleSlider value={residents} onChange={setResidents} />
                <WaterSource active={activeSource} onToggle={handleSourceChange} />
                {(activeSource === 'well' || activeSource === 'borehole') && (
                    <RangeSlider
                        value={depthWaterSource ?? 0}
                        onChange={setDepthWaterSource}
                        min={0}
                        max={200}
                        step={1}
                        label={activeSource === 'well' ? 'Глубина колодца' : 'Глубина скважины'}
                        unit="м"
                        isEditable={true}
                    />
                )}
            </div>
            <div className="join">
                <button className="join-item btn btn-secondary min-w-[30vw]" onClick={onCancel}>
                    Отмена
                </button>
                <button className="join-item btn btn-primary min-w-[30vw]" onClick={onNext}>
                    Далее
                </button>
            </div>
        </div>
    );
};
