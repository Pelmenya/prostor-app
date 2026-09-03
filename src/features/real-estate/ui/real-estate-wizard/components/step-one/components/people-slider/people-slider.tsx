'use client';

import { FC } from 'react';
import { RangeSlider } from '@/shared/ui';

export const PeopleSlider: FC<{ value: number; onChange: (value: number) => void }> = ({
    value,
    onChange,
}) => (
    <RangeSlider
        value={value}
        onChange={onChange}
        min={1}
        max={25}
        label="Жильцы"
        unit="чел."
        isEditable={true}
    />
);
