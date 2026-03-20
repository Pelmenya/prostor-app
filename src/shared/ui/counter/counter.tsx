'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib';

type TIconType = 'plus' | 'minus';

function ButtonWithIcon({
    onClick,
    disabled = false,
    icon,
    size = 'small',
}: {
    onClick?: () => void;
    disabled?: boolean;
    icon: TIconType;
    size?: 'normal' | 'small';
}) {
    const [pressed, setPressed] = useState(false);

    return (
        <button
            type="button"
            disabled={disabled || !onClick}
            onClick={() => {
                if (!disabled && onClick) onClick();
            }}
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerLeave={() => setPressed(false)}
            onPointerCancel={() => setPressed(false)}
            className={cn(
                'inline-flex items-center justify-center rounded-sm border bg-base-100 text-primary font-semibold transition-colors duration-100 select-none backdrop-blur-md',
                size === 'small' ? 'px-2 h-6 text-sm' : 'px-4 h-10 text-lg',
                pressed && 'bg-primary/10 shadow scale-95',
                disabled && 'opacity-40 pointer-events-none',
            )}
            style={{
                WebkitTapHighlightColor: 'rgba(0,0,0,0.08)',
                userSelect: 'none',
                touchAction: 'manipulation',
            }}
        >
            {icon === 'plus' && (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className={size === 'small' ? 'size-2.75' : 'size-3.5'}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            )}
            {icon === 'minus' && (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className={size === 'small' ? 'size-2.75' : 'size-3.5'}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                </svg>
            )}
        </button>
    );
}

type TCounterProps = {
    count: number;
    onIncrement?: () => void;
    onDecrement?: () => void;
    minCount?: number;
    maxCount?: number;
    size?: 'normal' | 'small';
};

export function Counter({
    count,
    onIncrement,
    onDecrement,
    minCount = -Infinity,
    maxCount = Infinity,
    size = 'small',
}: TCounterProps) {
    return (
        <div className="flex items-center">
            <ButtonWithIcon
                onClick={onDecrement}
                disabled={count <= minCount}
                icon="minus"
                size={size}
            />
            <p
                className={cn(
                    'text-center',
                    size === 'small' ? 'w-5.75 text-primary text-sm' : 'w-9',
                )}
            >
                {count}
            </p>
            <ButtonWithIcon
                onClick={onIncrement}
                disabled={count >= maxCount}
                icon="plus"
                size={size}
            />
        </div>
    );
}
