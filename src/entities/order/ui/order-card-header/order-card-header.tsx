import { EOrderStatus } from '../../model/types/e-order-status';
import { OrderStatus } from '../order-status/order-status';
import { formatDateRu } from '@/shared/lib';

type TOrderCardHeaderProps = {
    title: string;
    date: string;
    status: EOrderStatus;
};

export function OrderCardHeader({ title, date, status }: TOrderCardHeaderProps) {
    return (
        <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between w-full">
                <h6 className="text-sm">Заказ #{title}</h6>
                <div className="flex items-center gap-2">
                    <p className="text-base-content/60 text-ex-min">
                        От {formatDateRu(date)}
                    </p>
                    <OrderStatus status={status} />
                </div>
            </div>
        </div>
    );
}
