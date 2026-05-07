'use client';

import { forwardRef } from 'react';
import { WeeklyScheduleForm, WorkScheduleCalendar } from '@/features/master-schedule';
import type { TWeeklyScheduleFormHandle } from '@/features/master-schedule';

export const ScheduleStep = forwardRef<TWeeklyScheduleFormHandle>(function ScheduleStep(_, ref) {
    return (
        <div className="flex flex-col gap-6 max-w-lg mx-auto w-full">
            <h2 className="text-xl font-bold">График работы</h2>
            <p className="text-sm text-base-content/60">
                Настройте расписание. Нажмите на дату чтобы добавить рабочий день.
            </p>

            <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">Рабочие дни</p>
                <WorkScheduleCalendar />
            </div>

            <div className="divider my-0" />

            <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">Еженедельное расписание</p>
                <p className="text-sm text-base-content/60">
                    Шаблон для автоматического заполнения календаря.
                </p>
                <WeeklyScheduleForm ref={ref} hideSubmit />
            </div>
        </div>
    );
});
