'use client';

import { FC } from 'react';

type TRangeSliderProps = {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    label: string;
    unit: string;
    className?: string;
    isEditable: boolean;
};

export const RangeSlider: FC<TRangeSliderProps> = ({
    value,
    onChange,
    min,
    max,
    step = 1,
    label,
    unit,
    className,
    isEditable,
}) => {
    return (
        <div className={className}>
            <div className="w-full">
                <div className="w-full flex justify-between">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-sm">
                        {value} {unit}
                    </p>
                </div>
                <input
                    type="range"
                    disabled={!isEditable}
                    min={min}
                    max={max}
                    value={value}
                    className="w-full range range-xs range-primary"
                    step={step}
                    onChange={(e) => onChange(Number(e.target.value))}
                />
                <div className="w-full flex justify-between">
                    <p className="text-xs">{min}</p>
                    <p className="text-xs">{max}+</p>
                </div>
            </div>
        </div>
    );
};
