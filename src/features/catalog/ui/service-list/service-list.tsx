'use client';

import type { TService } from '@/entities/product';
import { ServiceCard } from '../service-card';

type TServicesListProps = {
    services: TService[];
    serviceStates: Record<string, { count: number; checked: boolean }>;
    onIncrement: (serviceId: string) => void;
    onDecrement: (serviceId: string) => void;
    onCheckboxChange: (serviceId: string, rateOfHours: number, price?: number) => void;
};

export function ServicesList({
    services,
    serviceStates,
    onIncrement,
    onDecrement,
    onCheckboxChange,
}: TServicesListProps) {
    // Служебный сервис 'NULL' = нет доступных услуг
    if (!services || services.length === 0 || services[0]?.name === 'NULL') {
        return null;
    }

    return (
        <div className="flex flex-col gap-4">
            {services.map((service, index) => (
                <div key={service.id}>
                    <ServiceCard
                        service={service}
                        count={serviceStates[service.id]?.count || 0}
                        checked={serviceStates[service.id]?.checked || false}
                        onIncrement={() => onIncrement(service.id)}
                        onDecrement={() => onDecrement(service.id)}
                        onCheckboxChange={onCheckboxChange}
                    />
                    {index < services.length - 1 && (
                        <div className="divider divider-vertical m-0" />
                    )}
                </div>
            ))}
        </div>
    );
}
