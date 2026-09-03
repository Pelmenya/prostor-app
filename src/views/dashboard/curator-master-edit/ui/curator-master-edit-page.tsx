'use client';

import { useState, useId, Suspense } from 'react';
import React from 'react';
import { CompactModal } from '@/shared/ui';
import {
    useGetCuratorServiceById,
    useUpdateMasterProfile,
    useUpdateMasterLocation,
    useUpdateMasterVehicle,
    useUpdateMasterSchedule,
    useFillMasterCalendar,
    useUpdateMasterZones,
} from '@/entities/user';
import { useGetMasterZonesByCurator, useGetZones, ZoneListItem } from '@/entities/service-zone';
import { WeeklyDayPicker } from '@/features/master-schedule';
import { PageContainer, DashboardBackHeader, QueryBoundary } from '@/shared/ui';
import { curatorMasterPath } from '@/shared/config';
import { formatRuPhoneForView } from '@/shared/lib';
import type { TCuratorMasterAccountService, TCuratorServiceUser, TWorkDay } from '@/shared/model';

const GRADE_OPTIONS = [
    { value: 'courier', label: 'Курьер' },
    { value: 'master', label: 'Мастер' },
    { value: 'specialist', label: 'Специалист' },
    { value: 'senior_specialist', label: 'Старший специалист' },
];

const DEPARTURE_OPTIONS = [
    { value: 'OWN_ADDRESS', label: 'От своего адреса' },
    { value: 'NEAREST_STORE', label: 'От ближайшего склада' },
];

const PHONE_RE = /^\+7\d{10}$/;

type TProps = { id: string };

export function CuratorMasterEditPage({ id }: TProps) {
    const userId = Number(id);
    return (
        <QueryBoundary errorMessage="Ошибка загрузки мастера" resetKeys={[userId]}>
            <EditContent userId={userId} />
        </QueryBoundary>
    );
}

function EditContent({ userId }: { userId: number }) {
    const { data: master } = useGetCuratorServiceById(userId);
    const fullName = [master.first_name, master.last_name].filter(Boolean).join(' ') || '—';
    const as = master.accountService;

    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader
                title={`Настройки: ${fullName}`}
                fallbackHref={curatorMasterPath(userId)}
            />
            <div className="flex flex-col gap-3 max-w-lg mx-auto py-4">
                <ProfileSection master={master} userId={userId} />
                <LocationSection as={as} userId={userId} />
                <VehicleSection as={as} userId={userId} />
                <ScheduleSection as={as} userId={userId} />
                <Suspense
                    fallback={
                        <div className="collapse bg-base-100 rounded-2xl p-4 text-sm text-base-content/40">
                            Загрузка зон...
                        </div>
                    }
                >
                    <ZonesSection userId={userId} />
                </Suspense>
            </div>
        </PageContainer>
    );
}

function SectionCollapse({
    title,
    children,
    defaultOpen,
}: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    return (
        <div className="collapse collapse-arrow bg-base-100 rounded-2xl">
            <input type="checkbox" defaultChecked={defaultOpen} />
            <div className="collapse-title font-medium">{title}</div>
            <div className="collapse-content">{children}</div>
        </div>
    );
}

function SaveRow({
    isPending,
    isSuccess,
    error,
    onSave,
}: {
    isPending: boolean;
    isSuccess: boolean;
    error: unknown;
    onSave: () => void;
}) {
    return (
        <div className="flex flex-col gap-2 mt-2">
            {!!error && (
                <p className="text-error text-sm">Не удалось сохранить. Попробуйте ещё раз.</p>
            )}
            {isSuccess && <p className="text-success text-sm">Сохранено</p>}
            <button
                type="button"
                onClick={onSave}
                disabled={isPending}
                className="btn btn-primary btn-sm w-full"
            >
                {isPending ? <span className="loading loading-spinner loading-xs" /> : 'Сохранить'}
            </button>
        </div>
    );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
    const id = useId();
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={id} className="text-xs text-base-content/50">
                {label}
            </label>
            {React.cloneElement(children as React.ReactElement<{ id?: string }>, { id })}
        </div>
    );
}

function NoAccountService() {
    return (
        <p className="text-sm text-base-content/40 italic">
            Мастер ещё не прошёл онбординг — AccountService не создан.
        </p>
    );
}

// ─── Профиль ────────────────────────────────────────────────────────────────

function ProfileSection({ master, userId }: { master: TCuratorServiceUser; userId: number }) {
    const { mutate, isPending, isSuccess, error, reset } = useUpdateMasterProfile();

    const [isDirty, setIsDirty] = useState(false);
    const [firstName, setFirstName] = useState(master.first_name ?? '');
    const [lastName, setLastName] = useState(master.last_name ?? '');
    const [phone, setPhone] = useState(master.phone ? formatRuPhoneForView(master.phone) : '');
    const [phoneError, setPhoneError] = useState('');

    // Sync from server when not dirty (adjusting state during render — React docs pattern)
    const serverKey = `${master.first_name}|${master.last_name}|${master.phone}`;
    const [prevServerKey, setPrevServerKey] = useState(serverKey);
    if (!isDirty && serverKey !== prevServerKey) {
        setPrevServerKey(serverKey);
        setFirstName(master.first_name ?? '');
        setLastName(master.last_name ?? '');
        setPhone(master.phone ? formatRuPhoneForView(master.phone) : '');
    }

    function handleSave() {
        setPhoneError('');
        const normalized = phone.replace(/[\s\-\(\)]/g, '');
        const e164 = normalized.startsWith('8') ? '+7' + normalized.slice(1) : normalized;
        if (e164 && !PHONE_RE.test(e164)) {
            setPhoneError('Формат: +7 999 999-99-99');
            return;
        }
        mutate(
            {
                userId,
                first_name: firstName.trim() || undefined,
                last_name: lastName.trim() || undefined,
                phone: e164 || undefined,
            },
            {
                onSuccess: () => {
                    setIsDirty(false);
                    setTimeout(() => reset(), 2000);
                },
            },
        );
    }

    return (
        <SectionCollapse title="Профиль" defaultOpen>
            <div className="flex flex-col gap-3">
                <FieldRow label="Имя">
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                            setFirstName(e.target.value);
                            setIsDirty(true);
                        }}
                        className="input input-bordered input-sm w-full"
                        placeholder="Иван"
                    />
                </FieldRow>
                <FieldRow label="Фамилия">
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                            setLastName(e.target.value);
                            setIsDirty(true);
                        }}
                        className="input input-bordered input-sm w-full"
                        placeholder="Иванов"
                    />
                </FieldRow>
                <FieldRow label="Телефон">
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                            setPhone(e.target.value);
                            setIsDirty(true);
                        }}
                        className={`input input-bordered input-sm w-full ${phoneError ? 'input-error' : ''}`}
                        placeholder="+7 999 999-99-99"
                    />
                </FieldRow>
                {phoneError && <p className="text-error text-xs">{phoneError}</p>}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-base-content/40">Email:</span>
                    <span className="text-xs">{master.email ?? 'не указан'}</span>
                    <span className="badge badge-xs badge-ghost">не редактируется</span>
                </div>
                <SaveRow
                    isPending={isPending}
                    isSuccess={isSuccess}
                    error={error}
                    onSave={handleSave}
                />
            </div>
        </SectionCollapse>
    );
}

// ─── Локация ─────────────────────────────────────────────────────────────────

function LocationSection({
    as,
    userId,
}: {
    as: TCuratorMasterAccountService | null;
    userId: number;
}) {
    const { mutate, isPending, isSuccess, error, reset } = useUpdateMasterLocation();

    const [isDirty, setIsDirty] = useState(false);
    const [address, setAddress] = useState(as?.address ?? '');
    const [departureBasis, setDepartureBasis] = useState<'OWN_ADDRESS' | 'NEAREST_STORE'>(
        as?.departureBasis ?? 'OWN_ADDRESS',
    );

    const serverKey = `${as?.address}|${as?.departureBasis}`;
    const [prevServerKey, setPrevServerKey] = useState(serverKey);
    if (!isDirty && serverKey !== prevServerKey) {
        setPrevServerKey(serverKey);
        setAddress(as?.address ?? '');
        setDepartureBasis(as?.departureBasis ?? 'OWN_ADDRESS');
    }

    function handleSave() {
        mutate(
            {
                userId,
                address: address.trim() || undefined,
                departureBasis,
                coordinates: as?.coordinates ?? undefined,
            },
            {
                onSuccess: () => {
                    setIsDirty(false);
                    setTimeout(() => reset(), 2000);
                },
            },
        );
    }

    return (
        <SectionCollapse title="Локация">
            {!as ? (
                <NoAccountService />
            ) : (
                <div className="flex flex-col gap-3">
                    <FieldRow label="Адрес">
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => {
                                setAddress(e.target.value);
                                setIsDirty(true);
                            }}
                            className="input input-bordered input-sm w-full"
                            placeholder="Москва, ул. Ленина, 1"
                        />
                    </FieldRow>
                    <FieldRow label="Откуда выезжает">
                        <select
                            value={departureBasis}
                            onChange={(e) => {
                                setDepartureBasis(
                                    e.target.value as 'OWN_ADDRESS' | 'NEAREST_STORE',
                                );
                                setIsDirty(true);
                            }}
                            className="select select-bordered select-sm w-full"
                        >
                            {DEPARTURE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </FieldRow>
                    <SaveRow
                        isPending={isPending}
                        isSuccess={isSuccess}
                        error={error}
                        onSave={handleSave}
                    />
                </div>
            )}
        </SectionCollapse>
    );
}

// ─── Автомобиль ──────────────────────────────────────────────────────────────

function VehicleSection({
    as,
    userId,
}: {
    as: TCuratorMasterAccountService | null;
    userId: number;
}) {
    const { mutate, isPending, isSuccess, error, reset } = useUpdateMasterVehicle();

    const [isDirty, setIsDirty] = useState(false);
    const [grade, setGrade] = useState(as?.grade ?? '');
    const [carModel, setCarModel] = useState(as?.carModel ?? '');
    const [carNumber, setCarNumber] = useState(as?.carNumber ?? '');
    const [length, setLength] = useState(as?.maxCargoLength?.toString() ?? '');
    const [width, setWidth] = useState(as?.maxCargoWidth?.toString() ?? '');
    const [height, setHeight] = useState(as?.maxCargoHeight?.toString() ?? '');
    const [weight, setWeight] = useState(as?.maxCargoWeight?.toString() ?? '');

    const serverKey = `${as?.grade}|${as?.carModel}|${as?.carNumber}|${as?.maxCargoLength}|${as?.maxCargoWidth}|${as?.maxCargoHeight}|${as?.maxCargoWeight}`;
    const [prevServerKey, setPrevServerKey] = useState(serverKey);
    if (!isDirty && serverKey !== prevServerKey) {
        setPrevServerKey(serverKey);
        setGrade(as?.grade ?? '');
        setCarModel(as?.carModel ?? '');
        setCarNumber(as?.carNumber ?? '');
        setLength(as?.maxCargoLength?.toString() ?? '');
        setWidth(as?.maxCargoWidth?.toString() ?? '');
        setHeight(as?.maxCargoHeight?.toString() ?? '');
        setWeight(as?.maxCargoWeight?.toString() ?? '');
    }

    function toNum(val: string): number | undefined {
        const n = parseInt(val, 10);
        return isNaN(n) || n <= 0 ? undefined : n;
    }

    function handleSave() {
        mutate(
            {
                userId,
                grade: (grade || undefined) as
                    | 'courier'
                    | 'specialist'
                    | 'senior_specialist'
                    | 'master'
                    | undefined,
                carModel: carModel.trim() || undefined,
                carNumber: carNumber.trim() || undefined,
                maxCargoLength: toNum(length),
                maxCargoWidth: toNum(width),
                maxCargoHeight: toNum(height),
                maxCargoWeight: toNum(weight),
            },
            {
                onSuccess: () => {
                    setIsDirty(false);
                    setTimeout(() => reset(), 2000);
                },
            },
        );
    }

    const markDirty = () => setIsDirty(true);

    return (
        <SectionCollapse title="Автомобиль">
            {!as ? (
                <NoAccountService />
            ) : (
                <div className="flex flex-col gap-3">
                    <FieldRow label="Грейд">
                        <select
                            value={grade}
                            onChange={(e) => {
                                setGrade(e.target.value);
                                markDirty();
                            }}
                            className="select select-bordered select-sm w-full"
                        >
                            <option value="">Не указан</option>
                            {GRADE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </FieldRow>
                    <FieldRow label="Модель">
                        <input
                            type="text"
                            value={carModel}
                            onChange={(e) => {
                                setCarModel(e.target.value);
                                markDirty();
                            }}
                            className="input input-bordered input-sm w-full"
                            placeholder="Toyota Hiace"
                        />
                    </FieldRow>
                    <FieldRow label="Гос. номер">
                        <input
                            type="text"
                            value={carNumber}
                            onChange={(e) => {
                                setCarNumber(e.target.value);
                                markDirty();
                            }}
                            className="input input-bordered input-sm w-full"
                            placeholder="А123БВ77"
                        />
                    </FieldRow>
                    <p className="text-xs text-base-content/40 font-medium uppercase tracking-wide mt-1">
                        Грузовой отсек
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Длина, см', value: length, set: setLength },
                            { label: 'Ширина, см', value: width, set: setWidth },
                            { label: 'Высота, см', value: height, set: setHeight },
                            { label: 'Макс. вес, кг', value: weight, set: setWeight },
                        ].map(({ label, value, set }) => (
                            <FieldRow key={label} label={label}>
                                <input
                                    type="number"
                                    min={0}
                                    value={value}
                                    onChange={(e) => {
                                        set(e.target.value);
                                        markDirty();
                                    }}
                                    className="input input-bordered input-sm w-full"
                                    placeholder="0"
                                />
                            </FieldRow>
                        ))}
                    </div>
                    <SaveRow
                        isPending={isPending}
                        isSuccess={isSuccess}
                        error={error}
                        onSave={handleSave}
                    />
                </div>
            )}
        </SectionCollapse>
    );
}

// ─── Расписание ───────────────────────────────────────────────────────────────

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function ScheduleSection({
    as,
    userId,
}: {
    as: TCuratorMasterAccountService | null;
    userId: number;
}) {
    const { mutate: saveSchedule, isPending: isSaving } = useUpdateMasterSchedule();
    const { mutate: fillCalendar, isPending: isFilling } = useFillMasterCalendar();
    const [isSuccess, setIsSuccess] = useState(false);
    const [hasError, setHasError] = useState(false);

    const [isDirty, setIsDirty] = useState(false);
    const [workDays, setWorkDays] = useState<TWorkDay[]>(as?.workDays ?? []);
    const [calendarMonths, setCalendarMonths] = useState(as?.calendarMonths ?? 2);
    const [editingDay, setEditingDay] = useState<TWorkDay | null>(null);

    const serverKey = `${JSON.stringify(as?.workDays)}|${as?.calendarMonths}`;
    const [prevServerKey, setPrevServerKey] = useState(serverKey);
    if (!isDirty && serverKey !== prevServerKey) {
        setPrevServerKey(serverKey);
        setWorkDays(as?.workDays ?? []);
        setCalendarMonths(as?.calendarMonths ?? 2);
    }

    function handleDaySelect(day: TWorkDay) {
        setEditingDay(day);
    }

    function handleEditorSave(updated: TWorkDay) {
        setWorkDays((prev) => {
            const exists = prev.some((d) => d.dayOfWeek === updated.dayOfWeek);
            return exists
                ? prev.map((d) => (d.dayOfWeek === updated.dayOfWeek ? updated : d))
                : [...prev, updated];
        });
        setIsDirty(true);
        setEditingDay(null);
    }

    function handleEditorRemove(day: TWorkDay) {
        setWorkDays((prev) => prev.filter((d) => d.dayOfWeek !== day.dayOfWeek));
        setIsDirty(true);
        setEditingDay(null);
    }

    function handleSave() {
        setIsSuccess(false);
        setHasError(false);
        saveSchedule(
            { userId, workDays, calendarMonths },
            {
                onSuccess: () => {
                    fillCalendar(userId, {
                        onSuccess: () => {
                            setIsDirty(false);
                            setIsSuccess(true);
                            setTimeout(() => setIsSuccess(false), 2000);
                        },
                        onError: () => setHasError(true),
                    });
                },
                onError: () => setHasError(true),
            },
        );
    }

    const isPending = isSaving || isFilling;

    return (
        <SectionCollapse title="Расписание">
            {!as ? (
                <NoAccountService />
            ) : (
                <div className="flex flex-col gap-4">
                    <WeeklyDayPicker workDays={workDays} onDaySelect={handleDaySelect} />

                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Заполнять календарь на</span>
                            <span className="text-sm font-semibold">{calendarMonths} мес.</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={12}
                            value={calendarMonths}
                            onChange={(e) => {
                                setCalendarMonths(Number(e.target.value));
                                setIsDirty(true);
                            }}
                            className="range range-primary range-sm w-full"
                        />
                        <div className="flex justify-between text-xs text-base-content/40 px-1">
                            <span>0</span>
                            <span>6</span>
                            <span>12</span>
                        </div>
                    </div>

                    <SaveRow
                        isPending={isPending}
                        isSuccess={isSuccess}
                        error={hasError ? 'error' : null}
                        onSave={handleSave}
                    />
                </div>
            )}

            {editingDay && (
                <DayTimeEditor
                    workDay={editingDay}
                    onSave={handleEditorSave}
                    onRemove={handleEditorRemove}
                    onClose={() => setEditingDay(null)}
                />
            )}
        </SectionCollapse>
    );
}

function DayTimeEditor({
    workDay,
    onSave,
    onRemove,
    onClose,
}: {
    workDay: TWorkDay;
    onSave: (day: TWorkDay) => void;
    onRemove: (day: TWorkDay) => void;
    onClose: () => void;
}) {
    const padTime = (n: number) => String(n).padStart(2, '0');
    const [startTime, setStartTime] = useState(
        `${padTime(workDay.startHour)}:${padTime(workDay.startMinute)}`,
    );
    const [endTime, setEndTime] = useState(
        `${padTime(workDay.endHour)}:${padTime(workDay.endMinute)}`,
    );
    const [timeError, setTimeError] = useState('');

    function parseTime(t: string): [number, number] {
        const [h = 0, m = 0] = t.split(':').map(Number);
        return [h, m];
    }

    function handleSave() {
        const [startHour, startMinute] = parseTime(startTime);
        const [endHour, endMinute] = parseTime(endTime);
        const startTotal = startHour * 60 + startMinute;
        const endTotal = endHour * 60 + endMinute;
        if (!startTime || !endTime || isNaN(startHour) || isNaN(endHour)) {
            setTimeError('Укажите время начала и конца');
            return;
        }
        if (endTotal <= startTotal) {
            setTimeError('Время конца должно быть позже начала');
            return;
        }
        onSave({ ...workDay, startHour, startMinute, endHour, endMinute });
    }

    const dayName = DAY_NAMES[workDay.dayOfWeek ?? 0] ?? '';

    return (
        <CompactModal isOpen title={dayName} onClose={onClose}>
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                    <FieldRow label="Начало">
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => {
                                setStartTime(e.target.value);
                                setTimeError('');
                            }}
                            className="input input-bordered input-sm w-full"
                        />
                    </FieldRow>
                    <FieldRow label="Конец">
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => {
                                setEndTime(e.target.value);
                                setTimeError('');
                            }}
                            className="input input-bordered input-sm w-full"
                        />
                    </FieldRow>
                </div>
                {timeError && <p className="text-error text-xs">{timeError}</p>}
                <div className="flex gap-2">
                    {workDay.dayOfWeek !== undefined && (
                        <button
                            type="button"
                            onClick={() => onRemove(workDay)}
                            className="btn btn-ghost btn-sm flex-1 text-error"
                        >
                            Убрать день
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleSave}
                        className="btn btn-primary btn-sm flex-1"
                    >
                        Готово
                    </button>
                </div>
            </div>
        </CompactModal>
    );
}

// ─── Зоны ────────────────────────────────────────────────────────────────────

function ZonesSection({ userId }: { userId: number }) {
    const { data: allZones } = useGetZones();
    const { data: masterZones } = useGetMasterZonesByCurator(userId);
    const { mutate, isPending, isSuccess, error, reset } = useUpdateMasterZones();

    const [isDirty, setIsDirty] = useState(false);
    const [selection, setSelection] = useState<number[]>(() => masterZones.map((z) => z.id));
    const [search, setSearch] = useState('');

    const serverKey = masterZones.map((z) => z.id).join(',');
    const [prevServerKey, setPrevServerKey] = useState(serverKey);
    if (!isDirty && serverKey !== prevServerKey) {
        setPrevServerKey(serverKey);
        setSelection(masterZones.map((z) => z.id));
    }

    const masterZoneIds = masterZones.map((z) => z.id);
    const visible = allZones.filter((z) => z.isActive || masterZoneIds.includes(z.id));
    const filtered = search.trim()
        ? visible.filter((z) => z.name.toLowerCase().includes(search.toLowerCase()))
        : visible;

    function handleToggle(zoneId: number) {
        setSelection((prev) =>
            prev.includes(zoneId) ? prev.filter((id) => id !== zoneId) : [...prev, zoneId],
        );
        setIsDirty(true);
    }

    function handleSave() {
        mutate(
            { userId, zoneIds: selection },
            {
                onSuccess: () => {
                    setIsDirty(false);
                    setTimeout(() => reset(), 2000);
                },
            },
        );
    }

    return (
        <SectionCollapse title={`Зоны обслуживания (${selection.length})`}>
            <div className="flex flex-col gap-3">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input input-bordered input-sm w-full"
                    placeholder="Поиск зоны..."
                    aria-label="Поиск зоны"
                />
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                    {filtered.map((zone) => (
                        <ZoneListItem
                            key={zone.id}
                            zone={zone}
                            isSelected={selection.includes(zone.id)}
                            onToggle={handleToggle}
                        />
                    ))}
                    {filtered.length === 0 && (
                        <p className="text-sm text-base-content/40">Зоны не найдены</p>
                    )}
                </div>
                <SaveRow
                    isPending={isPending}
                    isSuccess={isSuccess}
                    error={error}
                    onSave={handleSave}
                />
            </div>
        </SectionCollapse>
    );
}
