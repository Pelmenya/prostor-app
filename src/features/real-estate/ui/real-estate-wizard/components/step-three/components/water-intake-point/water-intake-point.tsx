'use client';

import { FC, ReactNode } from 'react';
import { Base, Counter } from '@/shared/ui';

type TWaterIntakePointProps = {
    name: string;
    count: number;
    onIncrement: () => void;
    onDecrement: () => void;
    children: ReactNode;
};

export const WaterIntakePoint: FC<TWaterIntakePointProps> = ({
    name,
    count,
    onIncrement,
    onDecrement,
    children,
}) => {
    return (
        <Base>
            <div className="w-full flex items-center justify-between px-4">
                <div className="flex items-center gap-4 text-sm font-semibold">
                    <div className="w-4">{children}</div>
                    {name}
                </div>
                <Counter
                    count={count}
                    onIncrement={onIncrement}
                    onDecrement={onDecrement}
                    minCount={0}
                />
            </div>
        </Base>
    );
};
