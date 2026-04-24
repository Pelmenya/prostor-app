'use client';

import { useState, useEffect } from 'react';
import { CompactModal } from '@/shared/ui';
import type { TWorkDay } from '@/shared/model';

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function pad(n: number) {
    return String(n).padStart(2, '0');
}

function toTimeStr(h: number, m: number) {
    return `${pad(h)}:${pad(m)}`;
}

function fromTimeStr(t: string): { h: number; m: number } {
    const [h, m] = t.split(':').map(Number);
    return { h: h ?? 0, m: m ?? 0 };
}

type TWorkDayTimeEditorProps = {
    workDay: TWorkDay;
    onSave: (day: TWorkDay) => void;
    onRemove: (day: TWorkDay) => void;
    onClose: () => void;
};

export function WorkDayTimeEditor({ workDay, onSave, onRemove, onClose }: TWorkDayTimeEditorProps) {
    const [startTime, setStartTime] = useState(toTimeStr(workDay.startHour, workDay.startMinute));
    const [endTime, setEndTime] = useState(toTimeStr(workDay.endHour, workDay.endMinute));

    useEffect(() => {
        setStartTime(toTimeStr(workDay.startHour, workDay.startMinute));
        setEndTime(toTimeStr(workDay.endHour, workDay.endMinute));
    }, [workDay]);

    const isExisting = !!workDay.id;
    const dayName =
        workDay.dayOfWeek !== undefined ? DAY_NAMES[workDay.dayOfWeek] : (workDay.date ?? '');

    function handleSave() {
        const start = fromTimeStr(startTime);
        const end = fromTimeStr(endTime);
        onSave({
            ...workDay,
            startHour: start.h,
            startMinute: start.m,
            endHour: end.h,
            endMinute: end.m,
        });
    }

    return (
        <CompactModal isOpen onClose={onClose} title={dayName}>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-base-content/60">Начало рабочего дня</label>
                    <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="input input-bordered input-sm w-full"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-base-content/60">Конец рабочего дня</label>
                    <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="input input-bordered input-sm w-full"
                    />
                </div>
                <div className="flex gap-2 pt-1">
                    <button onClick={handleSave} className="btn btn-primary flex-1">
                        Сохранить
                    </button>
                    {isExisting && (
                        <button
                            onClick={() => onRemove(workDay)}
                            className="btn btn-error btn-outline"
                        >
                            Удалить
                        </button>
                    )}
                </div>
            </div>
        </CompactModal>
    );
}
