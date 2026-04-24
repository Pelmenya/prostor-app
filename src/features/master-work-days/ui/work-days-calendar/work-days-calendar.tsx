'use client';

import { useMemo } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale';
import { useAccountService } from '@/entities/account-service';
import { useGetWorkDaysForCalendar } from '../../api/work-days.api';

registerLocale('ru', ru);

function toISODate(d: Date): string {
    return d.toLocaleDateString('en-CA');
}

type TWorkDaysCalendarProps = {
    onDayClick: (date: string) => void;
};

export function WorkDaysCalendar({ onDayClick }: TWorkDaysCalendarProps) {
    const { data: accountService } = useAccountService();
    const { data: workDays = [] } = useGetWorkDaysForCalendar();

    const calendarMonths = accountService?.calendarMonths ?? 2;

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const maxDate = new Date(
        today.getFullYear(),
        today.getMonth() + calendarMonths,
        today.getDate() - 1,
    );

    const { futureWorkDays, pastWorkDays, activeDates } = useMemo(() => {
        const future: Date[] = [];
        const past: Date[] = [];
        const active = new Set<string>();
        for (const d of workDays) {
            if (!d.date) continue;
            const date = new Date(d.date);
            date.setHours(0, 0, 0, 0);
            active.add(toISODate(date));
            if (date < today) past.push(date);
            else future.push(date);
        }
        return { futureWorkDays: future, pastWorkDays: past, activeDates: active };
    }, [workDays, today]);

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
