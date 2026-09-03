'use client';

import DatePicker, { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale';
import { useAccountService, useGetWorkDays } from '@/entities/account-service';

registerLocale('ru', ru);

function toISODate(d: Date): string {
    return d.toLocaleDateString('en-CA');
}

type TWorkDaysCalendarProps = {
    onDayClick: (date: string) => void;
};

export function WorkDaysCalendar({ onDayClick }: TWorkDaysCalendarProps) {
    const { data: accountService } = useAccountService();
    const { data: workDays = [] } = useGetWorkDays();

    const calendarMonths = accountService?.calendarMonths ?? 2;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(
        today.getFullYear(),
        today.getMonth() + calendarMonths,
        today.getDate() - 1,
    );

    const futureWorkDays: Date[] = [];
    const pastWorkDays: Date[] = [];
    const activeDates = new Set<string>();
    for (const d of workDays) {
        if (!d.date) continue;
        const date = new Date(d.date);
        date.setHours(0, 0, 0, 0);
        activeDates.add(toISODate(date));
        if (date < today) pastWorkDays.push(date);
        else futureWorkDays.push(date);
    }

    return (
        <DatePicker
            inline
            locale="ru"
            maxDate={maxDate}
            highlightDates={[
                { 'react-datepicker__day--highlighted-future': futureWorkDays },
                { 'react-datepicker__day--highlighted-past': pastWorkDays },
            ]}
            filterDate={(date) => activeDates.has(toISODate(date))}
            onChange={(date: Date | null) => {
                if (date) onDayClick(toISODate(date));
            }}
        />
    );
}
