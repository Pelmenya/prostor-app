'use client';

import { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale';
import { useAccountService, useGetWorkDays } from '@/entities/account-service';
import { useUpdateCalendarWorkDay, useDeleteCalendarWorkDay } from '../../api/schedule.api';
import { WorkDayTimeEditor } from '../work-day-time-editor/work-day-time-editor';
import type { TWorkDay } from '@/shared/model';

registerLocale('ru', ru);

function toISODate(d: Date): string {
    return d.toLocaleDateString('en-CA');
}

export function WorkScheduleCalendar() {
    const { data: accountService } = useAccountService();
    const { data: workDays = [] } = useGetWorkDays();
    const { mutate: updateDay } = useUpdateCalendarWorkDay();
    const { mutate: deleteDay } = useDeleteCalendarWorkDay();

    const [selectedDay, setSelectedDay] = useState<TWorkDay | null>(null);

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
    const byISO = new Map<string, TWorkDay>();
    for (const d of workDays) {
        if (!d.date) continue;
        const date = new Date(d.date);
        date.setHours(0, 0, 0, 0);
        byISO.set(toISODate(date), d);
        if (date < today) pastWorkDays.push(date);
        else futureWorkDays.push(date);
    }

    function handleDayClick(date: Date) {
        const iso = toISODate(date);
        const existing = byISO.get(iso);
        setSelectedDay(
            existing ?? {
                date: iso,
                startHour: 9,
                startMinute: 0,
                endHour: 18,
                endMinute: 0,
            },
        );
    }

    function handleSave(day: TWorkDay) {
        updateDay(day);
        setSelectedDay(null);
    }

    function handleRemove(day: TWorkDay) {
        deleteDay(day);
        setSelectedDay(null);
    }

    return (
        <>
            <DatePicker
                inline
                locale="ru"
                minDate={today}
                maxDate={maxDate}
                highlightDates={[
                    { 'react-datepicker__day--highlighted-future': futureWorkDays },
                    { 'react-datepicker__day--highlighted-past': pastWorkDays },
                ]}
                onChange={(date: Date | null) => {
                    if (date) handleDayClick(date);
                }}
            />

            {selectedDay && (
                <WorkDayTimeEditor
                    workDay={selectedDay}
                    onSave={handleSave}
                    onRemove={handleRemove}
                    onClose={() => setSelectedDay(null)}
                />
            )}
        </>
    );
}
