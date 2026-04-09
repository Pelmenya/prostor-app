'use client';

import { FC } from 'react';
import {
    HomeModernIcon,
    BuildingOffice2Icon,
    BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import { Counter, Borehole, Well, Reservoir, WaterSupply, RangeSlider } from '@/shared/ui';
import { useRealEstateWizardStore } from '../../../../model/real-estate-wizard.store';
import type { TWizardStepProps } from '../../types/t-wizard-step-props';
import type { TRealEstateType, TRealEstateSourceWater } from '@/shared/model';

const TYPE_OPTIONS: { value: TRealEstateType; label: string; Icon: FC<{ className?: string }> }[] =
    [
        { value: 'apartment', label: 'Квартира', Icon: BuildingOffice2Icon },
        { value: 'house', label: 'Дом', Icon: HomeModernIcon },
        { value: 'prom', label: 'Промобъект', Icon: BuildingLibraryIcon },
    ];

const SOURCE_OPTIONS: { value: TRealEstateSourceWater; label: string; Icon: FC }[] = [
    { value: 'waterSupply', label: 'Водопровод', Icon: WaterSupply },
    { value: 'borehole', label: 'Скважина', Icon: Borehole },
    { value: 'well', label: 'Колодец', Icon: Well },
    { value: 'reservoir', label: 'Водоём', Icon: Reservoir },
];

export const StepOne: FC<TWizardStepProps> = ({ onNext, onCancel }) => {
    const activeType = useRealEstateWizardStore((s) => s.activeType);
    const residents = useRealEstateWizardStore((s) => s.residents);
    const activeSource = useRealEstateWizardStore((s) => s.activeSource);
    const depthWaterSource = useRealEstateWizardStore((s) => s.depthWaterSource);

    const setActiveType = useRealEstateWizardStore((s) => s.setActiveType);
    const setResidents = useRealEstateWizardStore((s) => s.setResidents);
    const setActiveSource = useRealEstateWizardStore((s) => s.setActiveSource);
    const setDepthWaterSource = useRealEstateWizardStore((s) => s.setDepthWaterSource);

    const handleTypeChange = (type: TRealEstateType) => {
        setActiveType(type);
        if (type === 'apartment') {
            setActiveSource('waterSupply');
            setDepthWaterSource(null);
        }
    };

    const handleSourceChange = (source: TRealEstateSourceWater) => {
        setActiveSource(source);
        if (source === 'well' || source === 'borehole') {
            if (depthWaterSource == null) setDepthWaterSource(5);
        } else {
            setDepthWaterSource(null);
        }
    };

    const isApartment = activeType === 'apartment';

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Тип объекта */}
            <div className="grid grid-cols-3 gap-2">
                {TYPE_OPTIONS.map(({ value, label, Icon }) => {
                    const isActive = activeType === value;
                    return (
                        <button
                            key={value}
                            type="button"
                            onClick={() => handleTypeChange(value)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                                isActive
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-base-300 bg-base-100 text-base-content/60 hover:border-base-content/30'
                            }`}
                        >
                            <Icon className="size-7" />
                            <span className="text-xs font-medium leading-tight text-center">
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Жильцы */}
            <div className="flex items-center justify-between p-4 bg-base-100 border border-base-300 rounded-2xl">
                <span className="text-sm font-semibold">Жильцы</span>
                <Counter
                    count={residents}
                    onIncrement={() => setResidents(Math.min(residents + 1, 25))}
                    onDecrement={() => setResidents(Math.max(residents - 1, 1))}
                    minCount={1}
                    maxCount={25}
                    size="normal"
                />
            </div>

            {/* Источник воды */}
            {!isApartment ? (
                <div className="flex flex-col gap-3 p-4 bg-base-100 border border-base-300 rounded-2xl">
                    <span className="text-sm font-semibold">Источник воды</span>
                    <div className="grid grid-cols-2 gap-2">
                        {SOURCE_OPTIONS.map(({ value, label, Icon }) => {
                            const isActive = activeSource === value;
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => handleSourceChange(value)}
                                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all ${
                                        isActive
                                            ? 'border-primary bg-primary/5 text-primary font-semibold'
                                            : 'border-base-300 text-base-content/60 hover:border-base-content/30'
                                    }`}
                                >
                                    <div className="size-5 shrink-0 flex items-center justify-center">
                                        <Icon />
                                    </div>
                                    <span className="text-xs">{label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {(activeSource === 'well' || activeSource === 'borehole') && (
                        <RangeSlider
                            value={depthWaterSource ?? 0}
                            onChange={setDepthWaterSource}
                            min={0}
                            max={200}
                            step={1}
                            label={activeSource === 'well' ? 'Глубина колодца' : 'Глубина скважины'}
                            unit="м"
                            isEditable
                        />
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-2 p-4 bg-base-100 border border-base-300 rounded-2xl">
                    <div className="size-5 shrink-0 flex items-center justify-center text-base-content/40">
                        <WaterSupply />
                    </div>
                    <span className="text-sm text-base-content/60">Водопровод</span>
                    <span className="ml-auto text-xs text-base-content/40">по умолчанию</span>
                </div>
            )}

            {/* Кнопки */}
            <div className="flex gap-2 mt-2">
                <button type="button" className="btn btn-outline flex-1" onClick={onCancel}>
                    Отмена
                </button>
                <button type="button" className="btn btn-primary flex-1" onClick={onNext}>
                    Далее
                </button>
            </div>
        </div>
    );
};
