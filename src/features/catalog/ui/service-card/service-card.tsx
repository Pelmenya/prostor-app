'use client';

import { Counter } from '@/shared/ui/counter';
import { formatPrice, getSalePrices } from '@/shared/lib';
import type { TService } from '@/entities/product';

type TServiceCardProps = {
    service: TService;
    count: number;
    checked: boolean;
    onIncrement: () => void;
    onDecrement: () => void;
    onCheckboxChange: (serviceId: string, rateOfHours: number, price?: number) => void;
};

export function ServiceCard({
    service,
    count,
    checked,
    onIncrement,
    onDecrement,
    onCheckboxChange,
}: TServiceCardProps) {
    const unitPrice = getSalePrices(service?.salePrices)[0]?.value ?? 0;

    return (
        <div className="flex items-center justify-between gap-2">
            <label
                htmlFor={service.id}
                className={`text-sm flex items-center gap-4 ${checked ? 'text-primary' : ''}`}
            >
                <input
                    id={service.id}
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                        onCheckboxChange(service.id, service.rateOfHours ?? 0, unitPrice)
                    }
                    className="checkbox checkbox-sm checked:text-primary"
                />
                {service.name}
            </label>

            <div className="flex flex-col items-end gap-1 sm:flex-row sm:gap-2 sm:items-center">
                {checked && (
                    <Counter
                        count={count || 0}
                        onIncrement={onIncrement}
                        onDecrement={onDecrement}
                        minCount={0}
                    />
                )}
                <span className="text-sm text-nowrap">{formatPrice(unitPrice)}</span>
            </div>
        </div>
    );
}
