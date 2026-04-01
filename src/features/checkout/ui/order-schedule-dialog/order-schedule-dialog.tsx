'use client';

import { CompactModal } from '@/shared/ui';
import { formatDateRu, formatPrice } from '@/shared/lib';
import type { TUserWithWorkDays } from '../../model/types/t-user-with-work-days';
import type { TWorkDay } from '@/entities/order';
import type { TClientVisitPriceItem } from '@/entities/delivery';

type TOrderScheduleDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (executor: { user: TUserWithWorkDays['user'] | null; workDays: TWorkDay[] }) => void;
    executorsWithWorkDays: TUserWithWorkDays[];
    selectedExecutor?: TUserWithWorkDays;
    desiredIntervalDate?: [TWorkDay, TWorkDay] | null;
    searchStatus?: 'idle' | 'loading' | 'success' | 'failed';
    visitPrices?: TClientVisitPriceItem[];
};

export function OrderScheduleDialog({
    isOpen,
    onClose,
    onSelect,
    executorsWithWorkDays,
    selectedExecutor,
    desiredIntervalDate,
    searchStatus = 'idle',
    visitPrices,
}: TOrderScheduleDialogProps) {
    const showIntervalFallback = searchStatus === 'failed' || executorsWithWorkDays.length === 0;

    const priceByExecutor = new Map<number, TClientVisitPriceItem>();
    if (visitPrices) {
        for (const item of visitPrices) {
            priceByExecutor.set(Number(item.executorId), item);
        }
    }

    const title =
        searchStatus === 'loading'
            ? 'Поиск мастеров...'
            : showIntervalFallback
              ? 'Выберите желаемый интервал дат'
              : 'Выберите мастера и дату';

    return (
        <CompactModal isOpen={isOpen} onClose={onClose} title={title}>
            {searchStatus === 'loading' ? (
                <div className="flex justify-center py-8">
                    <span className="loading loading-spinner loading-lg" />
                </div>
            ) : showIntervalFallback ? (
                <IntervalPicker
                    onSelect={onSelect}
                    onClose={onClose}
                    initialFrom={desiredIntervalDate?.[0]?.date ?? undefined}
                    initialTo={desiredIntervalDate?.[1]?.date ?? undefined}
                />
            ) : (
                <ul className="space-y-4">
                    {executorsWithWorkDays.map((executor) => {
                        const visitPrice = priceByExecutor.get(Number(executor.user.id));
                        return (
                            <li
                                key={executor.user.id}
                                className="flex flex-col gap-2 border border-base-content/10 rounded-xl p-3"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">
                                        {executor.user.first_name} {executor.user.last_name}
                                    </span>
                                    {visitPrice && (
                                        <span className="text-xs opacity-70">
                                            Выезд: {formatPrice(visitPrice.totalPrice)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {executor.workDays.map((day, i) => {
                                        if (!day.date) return null;
                                        const isSelected =
                                            selectedExecutor?.user?.id === executor.user.id &&
                                            selectedExecutor?.workDays?.[0]?.date === day.date;
                                        return (
                                            <button
                                                key={day.id ?? i}
                                                type="button"
                                                onClick={() => {
                                                    onSelect({
                                                        user: executor.user,
                                                        workDays: [day],
                                                    });
                                                    onClose();
                                                }}
                                                className={`btn btn-xs ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                                            >
                                                {formatDateRu(day.date)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </CompactModal>
    );
}

type TIntervalPickerProps = {
    onSelect: (executor: { user: null; workDays: TWorkDay[] }) => void;
    onClose: () => void;
    initialFrom?: string;
    initialTo?: string;
};

function IntervalPicker({ onSelect, onClose, initialFrom, initialTo }: TIntervalPickerProps) {
    const makeWorkDay = (date: string): TWorkDay => ({
        date,
        startHour: 9,
        startMinute: 0,
        endHour: 18,
        endMinute: 0,
    });

    const today = new Date().toISOString().split('T')[0];

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const from = fd.get('from') as string;
        const to = fd.get('to') as string;
        if (!from || !to) return;
        if (from > to) {
            (e.currentTarget.elements.namedItem('to') as HTMLInputElement).setCustomValidity(
                'Дата окончания должна быть не раньше даты начала',
            );
            (e.currentTarget.elements.namedItem('to') as HTMLInputElement).reportValidity();
            return;
        }
        (e.currentTarget.elements.namedItem('to') as HTMLInputElement).setCustomValidity('');
        onSelect({ user: null, workDays: [makeWorkDay(from), makeWorkDay(to)] });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-base-content/70">
                Не удалось найти мастеров по вашему адресу. Выберите желаемый интервал — мы подберем
                подходящего мастера
            </p>
            <div className="flex gap-2">
                <div className="flex flex-col gap-2 flex-1">
                    <label className="text-sm">С</label>
                    <input
                        type="date"
                        name="from"
                        min={today}
                        defaultValue={initialFrom}
                        required
                        className="input input-bordered input-sm w-full"
                        onClick={(e) => e.currentTarget.showPicker()}
                    />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                    <label className="text-sm">По</label>
                    <input
                        type="date"
                        name="to"
                        min={today}
                        defaultValue={initialTo}
                        required
                        className="input input-bordered input-sm w-full"
                        onClick={(e) => e.currentTarget.showPicker()}
                        onChange={(e) => e.currentTarget.setCustomValidity('')}
                    />
                </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
                Выбрать
            </button>
        </form>
    );
}
