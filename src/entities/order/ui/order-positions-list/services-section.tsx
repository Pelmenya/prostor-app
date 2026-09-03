import type { TCartItem, TCartServiceItem } from '@/shared/model';
import { EServiceCategory as ServiceCategory } from '@/shared/model';
import { getServiceInfo } from '../../lib/get-service-info';
import { OrderServiceCard } from '../order-service-card/order-service-card';

type TServicesSectionProps = {
    items: TCartItem[];
    category: ServiceCategory | undefined;
    label: string;
    icon: React.ReactNode;
};

export function ServicesSection({ items, category, label, icon }: TServicesSectionProps) {
    return (
        <>
            {items.map((it) => {
                const checkedServices = Object.values(it.services || {}).filter(
                    (s: TCartServiceItem) => {
                        const serviceCategory = getServiceInfo(s)?.category as
                            | ServiceCategory
                            | undefined;
                        return (
                            s?.checked &&
                            s?.count > 0 &&
                            (category === undefined
                                ? serviceCategory === undefined
                                : serviceCategory === category)
                        );
                    },
                );

                if (checkedServices.length === 0) return null;

                return (
                    <div
                        key={`${it.product?.id}-${label}`}
                        className="relative border border-base-300 rounded-2xl p-4 flex flex-col gap-3"
                    >
                        <span className="badge badge-sm border-base-300 absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                            <span className="flex items-center gap-2 font-semibold leading-6">
                                {icon}
                                {label}
                            </span>
                        </span>
                        <p className="text-xs text-base-content/60 line-clamp-1">
                            {it.product?.name}
                        </p>
                        {checkedServices.map((serviceItem, idx) => (
                            <OrderServiceCard
                                key={getServiceInfo(serviceItem)?.id ?? idx}
                                service={serviceItem}
                                isLast={idx === checkedServices.length - 1}
                            />
                        ))}
                    </div>
                );
            })}
        </>
    );
}
