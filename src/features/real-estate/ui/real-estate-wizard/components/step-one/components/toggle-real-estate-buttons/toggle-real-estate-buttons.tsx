'use client';

import { FC } from 'react';
import type { TRealEstateType } from '@/shared/model';

export const ToggleRealEstateButtons: FC<{
    active: TRealEstateType;
    onToggle: (type: TRealEstateType) => void;
}> = ({ active, onToggle }) => {
    return (
        <div className="w-full flex items-center bg-base-100">
            <div className="join w-full">
                <button
                    className={`btn join-item min-w-[33%] ${active === 'house' ? 'btn-primary' : 'btn-primary btn-outline'}`}
                    onClick={() => onToggle('house')}
                >
                    Дом
                </button>
                <button
                    className={`btn join-item min-w-[34%] ${active === 'apartment' ? 'btn-primary' : 'btn-primary btn-outline'}`}
                    onClick={() => onToggle('apartment')}
                >
                    Квартира
                </button>
                <button
                    className={`btn join-item w-[34%] ${active === 'prom' ? 'btn-primary' : 'btn-primary btn-outline'}`}
                    onClick={() => onToggle('prom')}
                >
                    Промобъект
                </button>
            </div>
        </div>
    );
};
