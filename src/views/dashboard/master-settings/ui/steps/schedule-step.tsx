'use client';

import { forwardRef, useImperativeHandle } from 'react';
import { WeeklyScheduleForm, WorkScheduleCalendar } from '@/features/master-schedule';

export type TScheduleStepHandle = {
    submit: () => Promise<boolean>;
};

export const ScheduleStep = forwardRef<TScheduleStepHandle>(function ScheduleStep(_, ref) {
    useImperativeHandle(ref, () => ({
        submit: async () => true,
    }));

    return (
        <div className="flex flex-col gap-6 max-w-lg mx-auto w-full">
            <h2 className="text-xl font-bold">График работы</h2>
            <p className="text-sm text-base-content/60">
                Настройте расписание. Нажмите на дату чтобы добавить рабочий день. Можно изменить
                позже.
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
                <WeeklyScheduleForm />
            </div>
        </div>
    );
});
