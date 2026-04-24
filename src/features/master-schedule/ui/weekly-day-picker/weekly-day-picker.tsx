import type { TWorkDay } from '@/shared/model';

const DAYS: { idx: number; label: string }[] = [
    { idx: 1, label: 'Пн' },
    { idx: 2, label: 'Вт' },
    { idx: 3, label: 'Ср' },
    { idx: 4, label: 'Чт' },
    { idx: 5, label: 'Пт' },
    { idx: 6, label: 'Сб' },
    { idx: 0, label: 'Вс' },
];

type TWeeklyDayPickerProps = {
    workDays: TWorkDay[];
    onDaySelect: (day: TWorkDay) => void;
};

export function WeeklyDayPicker({ workDays, onDaySelect }: TWeeklyDayPickerProps) {
    function handleClick(idx: number) {
        const existing = workDays.find((d) => d.dayOfWeek === idx);
        onDaySelect(
            existing ?? {
                date: null,
                dayOfWeek: idx,
                startHour: 8,
                startMinute: 0,
                endHour: 17,
                endMinute: 0,
            },
        );
    }

    return (
        <div className="flex gap-2 flex-wrap">
            {DAYS.map(({ idx, label }) => {
                const active = workDays.some((d) => d.dayOfWeek === idx);
                return (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => handleClick(idx)}
                        className={`btn btn-sm flex-1 ${active ? 'btn-primary' : 'btn-outline'}`}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
