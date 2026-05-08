'use client';

import type { ReactNode } from 'react';

type TLayerToggleRowProps = {
    label: string;
    description?: string;
    icon?: ReactNode;
    checked: boolean;
    onChange: (v: boolean) => void;
    /** Контент справа toggle (для счётчиков, badge'ов). */
    accessory?: ReactNode;
};

/**
 * Один ряд toggle'а слоя в layer-panel. Использует daisyui toggle с
 * primary color, label и описанием.
 */
export function LayerToggleRow({
    label,
    description,
    icon,
    checked,
    onChange,
    accessory,
}: TLayerToggleRowProps) {
    return (
        <label className="flex items-start gap-3 py-2.5 px-1 cursor-pointer">
            {icon && <div className="mt-0.5 size-5 shrink-0 text-base-content/60">{icon}</div>}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-base-content">{label}</span>
                    {accessory}
                </div>
                {description && (
                    <p className="text-xs text-base-content/60 mt-0.5 leading-snug">
                        {description}
                    </p>
                )}
            </div>
            <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm shrink-0 mt-1"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
        </label>
    );
}
