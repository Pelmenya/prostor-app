'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { useAccountService, useUpdateAccountService } from '@/entities/account-service';
import { useFillCalendar } from '../../api/schedule.api';
import { WeeklyDayPicker } from '../weekly-day-picker/weekly-day-picker';
import { WorkDayTimeEditor } from '../work-day-time-editor/work-day-time-editor';
import type { TWorkDay } from '@/shared/model';

export type TWeeklyScheduleFormHandle = {
    submit: () => Promise<boolean>;
};

type TWeeklyScheduleFormProps = {
    hideSubmit?: boolean;
};

export const WeeklyScheduleForm = forwardRef<TWeeklyScheduleFormHandle, TWeeklyScheduleFormProps>(
    function WeeklyScheduleForm({ hideSubmit = false }, ref) {
        const { data: accountService } = useAccountService();
        const { mutateAsync: updateAccountService } = useUpdateAccountService();
        const { mutateAsync: fillCalendar, isPending: isFilling } = useFillCalendar();

        const [weeklyDays, setWeeklyDays] = useState<TWorkDay[]>(accountService?.workDays ?? []);
        const [calendarMonths, setCalendarMonths] = useState<number>(
            accountService?.calendarMonths ?? 2,
        );
        const [selectedDay, setSelectedDay] = useState<TWorkDay | null>(null);
        const [isSaving, setIsSaving] = useState(false);
        const [saveError, setSaveError] = useState(false);

        function handleDaySelect(day: TWorkDay) {
            setSelectedDay(day);
        }

        function handleEditorSave(updated: TWorkDay) {
            setWeeklyDays((prev) => {
                const exists = prev.some((d) => d.dayOfWeek === updated.dayOfWeek);
                return exists
                    ? prev.map((d) => (d.dayOfWeek === updated.dayOfWeek ? updated : d))
                    : [...prev, updated];
            });
            setSelectedDay(null);
        }

        function handleEditorRemove(day: TWorkDay) {
            setWeeklyDays((prev) => prev.filter((d) => d.dayOfWeek !== day.dayOfWeek));
            setSelectedDay(null);
        }

        useImperativeHandle(ref, () => ({
            submit: async () => {
                setIsSaving(true);
                setSaveError(false);
                try {
                    await updateAccountService({ workDays: weeklyDays, calendarMonths });
                    await fillCalendar();
                    return true;
                } catch {
                    setSaveError(true);
                    return false;
                } finally {
                    setIsSaving(false);
                }
            },
        }));

        async function handleSave() {
            setIsSaving(true);
            setSaveError(false);
            try {
                await updateAccountService({ workDays: weeklyDays, calendarMonths });
                await fillCalendar();
            } catch {
                setSaveError(true);
            } finally {
                setIsSaving(false);
            }
        }

        const isPending = isSaving || isFilling;

        return (
            <>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                        <p className="text-sm font-medium">Рабочие дни</p>
                        <WeeklyDayPicker workDays={weeklyDays} onDaySelect={handleDaySelect} />
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-medium">Заполнять календарь на</p>
                            <span className="text-sm font-semibold">{calendarMonths} мес.</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={12}
                            value={calendarMonths}
                            onChange={(e) => setCalendarMonths(Number(e.target.value))}
                            className="range range-primary range-sm w-full"
                        />
                        <div className="flex justify-between text-xs text-base-content/40 px-1">
                            <span>0</span>
                            <span>6</span>
                            <span>12</span>
                        </div>
                    </div>

                    {saveError && (
                        <div className="alert alert-error text-sm">
                            Не удалось сохранить. Попробуйте ещё раз.
                        </div>
                    )}

                    {!hideSubmit && (
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isPending}
                            className="btn btn-primary w-full"
                        >
                            {isPending ? (
                                <span className="loading loading-spinner loading-sm" />
                            ) : (
                                'Сохранить'
                            )}
                        </button>
                    )}
                </div>

                {selectedDay && (
                    <WorkDayTimeEditor
                        key={selectedDay.dayOfWeek ?? selectedDay.date}
                        workDay={selectedDay}
                        onSave={handleEditorSave}
                        onRemove={handleEditorRemove}
                        onClose={() => setSelectedDay(null)}
                    />
                )}
            </>
        );
    },
);
