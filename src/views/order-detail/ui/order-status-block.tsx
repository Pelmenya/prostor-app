import { EOrderStatus, STATUS_STEP, STATUS_LABEL } from '@/entities/order';
import type { TOrder } from '@/entities/order';
import { formatDateRu } from '@/shared/lib';
import { CheckCircleIcon, CubeIcon, ShoppingCartIcon, TruckIcon } from '@heroicons/react/24/solid';

type TOrderStatusBlockProps = {
    status: EOrderStatus;
    scheduledDate: TOrder['scheduledDate'];
    createdAt: string;
    updatedAt: string;
    isCompact: boolean;
};

export function OrderStatusBlock({
    status,
    scheduledDate,
    createdAt,
    updatedAt,
    isCompact,
}: TOrderStatusBlockProps) {
    const dateForStatus = new Date(
        status === EOrderStatus.PENDING ? createdAt : updatedAt,
    ).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });

    return (
        <div className="relative flex flex-col gap-4 p-4 bg-base-100 border border-base-300 rounded-2xl w-full">
            {!isCompact && (
                <>
                    <div className="flex gap-2">
                        <span className="font-semibold text-sm leading-110">Дата доставки</span>
                        <span className="text-sm leading-110">
                            {scheduledDate?.date
                                ? `${formatDateRu(scheduledDate.date)} ${String(scheduledDate.startHour).padStart(2, '0')}:${String(scheduledDate.startMinute).padStart(2, '0')}`
                                : 'Уточняется'}
                        </span>
                    </div>
                    <ul className="steps">
                        <li className={`step ${STATUS_STEP[status] >= 1 ? 'step-primary' : ''}`}>
                            <span className="step-icon">
                                <ShoppingCartIcon className="shrink-0 size-5 text-base-100" />
                            </span>
                        </li>
                        <li className={`step ${STATUS_STEP[status] >= 2 ? 'step-primary' : ''}`}>
                            <span className="step-icon">
                                <CubeIcon className="shrink-0 size-5" />
                            </span>
                        </li>
                        <li className={`step ${STATUS_STEP[status] >= 3 ? 'step-primary' : ''}`}>
                            <span className="step-icon">
                                <TruckIcon className="shrink-0 size-5" />
                            </span>
                        </li>
                        <li className={`step ${STATUS_STEP[status] >= 4 ? 'step-primary' : ''}`}>
                            <span className="step-icon">
                                <CheckCircleIcon className="shrink-0 size-5" />
                            </span>
                        </li>
                    </ul>
                    <hr className="h-px text-base-300" />
                </>
            )}

            <div className="flex justify-between">
                <span className={`text-sm leading-110 ${STATUS_LABEL[status].className}`}>
                    {STATUS_LABEL[status].text}
                </span>
                <span className="font-medium text-sm leading-110 opacity-60">{dateForStatus}</span>
            </div>
        </div>
    );
}
