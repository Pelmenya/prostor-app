import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import type { TOrder } from '@/entities/order';
import { formatDateRu } from '@/shared/lib';

type TScheduleCardProps = {
    scheduledDate: TOrder['scheduledDate'];
};

export function ScheduleCard({ scheduledDate }: TScheduleCardProps) {
    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-2">
            <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                Расписание
            </p>
            <div className="flex items-center gap-2">
                <CalendarDaysIcon className="size-5 shrink-0 text-base-content/40" />
                <span className="text-sm">
                    {scheduledDate?.date ? formatDateRu(scheduledDate.date) : 'Дата не назначена'}
                </span>
            </div>
            {scheduledDate && (
                <div className="flex items-center gap-2">
                    <ClockIcon className="size-5 shrink-0 text-base-content/40" />
                    <span className="text-sm text-base-content/60">
                        {scheduledDate.startHour}:
                        {String(scheduledDate.startMinute).padStart(2, '0')}
                        {' – '}
                        {scheduledDate.endHour}:{String(scheduledDate.endMinute).padStart(2, '0')}
                    </span>
                </div>
            )}
        </div>
    );
}
