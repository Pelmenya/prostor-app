import type { TCartServiceItem } from '@/shared/model';
import { formatPrice } from '@/shared/lib';
import { getServiceInfo } from '../../lib/get-service-info';
import { OrderPositionCount } from '../order-position-count/order-position-count';

type TOrderServiceCardProps = {
    service: TCartServiceItem;
    isLast: boolean;
};

export function OrderServiceCard({ service, isLast }: TOrderServiceCardProps) {
    const info = getServiceInfo(service);
    const serviceName = info?.name || info?.id || 'Без названия';

    return (
        <>
            <div className="flex items-center gap-2 justify-between">
                <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="max-w-[223px] sm:max-w-[439px] md:max-w-[615px] lg:max-w-[839px] xl:max-w-[1015px] text-sm/4 line-clamp-3">
                        {serviceName}
                    </p>
                    {service.price != null && (
                        <span className="text-xs text-base-content/50">
                            {formatPrice(service.price)}
                        </span>
                    )}
                </div>
                <OrderPositionCount count={service.count} />
            </div>
            {!isLast && <div className="divider my-0" />}
        </>
    );
}
