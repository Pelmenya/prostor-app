import type { TCartServiceItem } from '@/shared/model';
import { OrderPositionCount } from '../order-position-count/order-position-count';

type TOrderServiceCardProps = {
    service: TCartServiceItem;
    isLast: boolean;
};

// Старые заказы (Telegram-фронт) хранят поле `service`, новые — `serviceInfo`
type TLegacyServiceEntry = { service?: { name?: string; id?: string } };

export function OrderServiceCard({ service, isLast }: TOrderServiceCardProps) {
    const info = service.serviceInfo ?? (service as TLegacyServiceEntry).service;
    const serviceName = info?.name || info?.id || 'Без названия';

    return (
        <>
            <div className="flex items-center gap-2 justify-between">
                <p className="max-w-[223px] sm:max-w-[439px] md:max-w-[615px] lg:max-w-[839px] xl:max-w-[1015px] text-sm/4 line-clamp-3">
                    {serviceName}
                </p>
                <OrderPositionCount count={service.count} />
            </div>
            {!isLast && <div className="divider my-0" />}
        </>
    );
}
