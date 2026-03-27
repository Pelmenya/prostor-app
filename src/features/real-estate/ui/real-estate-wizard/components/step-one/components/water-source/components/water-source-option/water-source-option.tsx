'use client';

import { FC, ReactNode } from 'react';

export const WaterSourceOption: FC<{
    isActive: boolean;
    onClick: () => void;
    label: string;
    children: ReactNode;
}> = ({ isActive, onClick, label, children }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`cursor-pointer py-3 rounded-box bg-base-100 border ${isActive ? 'border-primary text-primary' : 'border-base-300'} transition-colors duration-100`}
        >
            <div className="flex flex-col items-center justify-between h-full gap-2">
                <div
                    className={`transition-colors duration-100 ${isActive ? 'text-primary' : 'text-base-content'}`}
                >
                    {children}
                </div>
                <p className="text-ex-min">{label}</p>
            </div>
        </button>
    );
};
