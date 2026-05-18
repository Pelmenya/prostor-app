'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PhoneIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { HomeIcon, MapPinIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import {
    useGetOrderById,
    useUpdateOrderStatus,
    useUpdateOrderSchedule,
    useUpdateOrderExecutor,
    OrderPositionsList,
    STATUS_LABEL,
    EOrderStatus,
} from '@/entities/order';
import { useGetCuratorMasters } from '@/entities/user';
import {
    CURATOR_ORDERS_PATH,
    COMMISSION_PERCENTS,
    curatorClientPath,
    curatorMasterPath,
} from '@/shared/config';
import { formatDateRu, formatUserInitials, formatPrice } from '@/shared/lib';
import { PageContainer, DashboardBackHeader, QueryBoundary } from '@/shared/ui';
import type { TOrder } from '@/entities/order';

type TProps = { id: string };

export function CuratorOrderDetailPage({ id }: TProps) {
    const orderId = Number(id);
    return (
        <QueryBoundary errorMessage="Ошибка загрузки заказа" resetKeys={[orderId]}>
            <CuratorOrderDetailContent orderId={orderId} />
        </QueryBoundary>
    );
}

function CuratorOrderDetailContent({ orderId }: { orderId: number }) {
    const { data: order } = useGetOrderById(orderId);
    const hasItems = Object.keys(order.cartState.items ?? {}).length > 0;

    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader title={`Заказ #${orderId}`} fallbackHref={CURATOR_ORDERS_PATH} />
            <div className="flex flex-col gap-3 max-w-lg mx-auto py-4">
                <StatusCard order={order} />
                {order.client && (
                    <PersonCard
                        label="Клиент"
                        user={order.client}
                        href={curatorClientPath(order.client.id)}
                    />
                )}
                {order.executor && (
                    <PersonCard
                        label="Мастер"
                        user={order.executor}
                        href={curatorMasterPath(order.executor.id)}
                    />
                )}
                {!order.executor && <NoExecutorCard />}
                {order.realEstate && <AddressCard realEstate={order.realEstate} />}
                <ScheduleCard scheduledDate={order.scheduledDate} />
                {hasItems && <ItemsCard order={order} />}
                <PaymentCard order={order} />
                <ManagementCard order={order} />
            </div>
        </PageContainer>
    );
}

function StatusCard({ order }: { order: TOrder }) {
    const label = STATUS_LABEL[order.status];
    return (
        <div className="card bg-base-100 p-4 flex flex-row items-center justify-between gap-2">
            <span className="text-sm font-medium">Статус</span>
            <span className={`text-sm font-semibold ${label?.className ?? ''}`}>
                {label?.text ?? order.status}
            </span>
        </div>
    );
}

type TPersonCardUser = {
    id: number;
    first_name: string;
    last_name: string;
    phone?: string;
    photo_url?: string;
};

function PersonCard({
    label,
    user,
    href,
}: {
    label: string;
    user: TPersonCardUser;
    href?: string;
}) {
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || `ID ${user.id}`;
    const initials = formatUserInitials(user.first_name, user.last_name);

    const avatar = (
        <div className={`avatar shrink-0 ${!user.photo_url ? 'avatar-placeholder' : ''}`}>
            <div className="relative size-10 rounded-full overflow-hidden bg-primary/10 text-primary">
                {user.photo_url ? (
                    <Image src={user.photo_url} alt={name} fill className="object-cover" />
                ) : (
                    <span className="text-sm font-semibold">{initials}</span>
                )}
            </div>
        </div>
    );

    const content = (
        <div className="flex items-center gap-3">
            {avatar}
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="font-medium text-sm leading-tight">{name}</span>
                {user.phone && (
                    <a
                        href={`tel:${user.phone}`}
                        className="flex items-center gap-1 text-primary text-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <PhoneIcon className="size-3.5" />
                        {user.phone}
                    </a>
                )}
            </div>
            {href && <ChevronRightIcon className="size-4 text-base-content/30 shrink-0" />}
        </div>
    );

    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-3">
            <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                {label}
            </p>
            {href ? (
                <Link href={href} className="hover:opacity-70 transition-opacity">
                    {content}
                </Link>
            ) : (
                content
            )}
        </div>
    );
}

function NoExecutorCard() {
    return (
        <div className="card bg-base-100 p-4 flex flex-row items-center justify-between">
            <span className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                Мастер
            </span>
            <span className="badge badge-sm badge-ghost">Не назначен</span>
        </div>
    );
}

function AddressCard({ realEstate }: { realEstate: NonNullable<TOrder['realEstate']> }) {
    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-2">
            <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                Адрес
            </p>
            <div className="flex items-start gap-2">
                <HomeIcon className="size-5 shrink-0 text-base-content/40 mt-0.5" />
                <span className="text-sm">{realEstate.address}</span>
            </div>
            {realEstate.city && (
                <div className="flex items-center gap-2">
                    <MapPinIcon className="size-5 shrink-0 text-base-content/40" />
                    <span className="text-sm text-base-content/60">{realEstate.city}</span>
                </div>
            )}
        </div>
    );
}

function ScheduleCard({ scheduledDate }: { scheduledDate: TOrder['scheduledDate'] }) {
    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-2">
            <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                Расписание
            </p>
            <div className="flex items-center gap-2">
                <CalendarDaysIcon className="size-5 shrink-0 text-base-content/40" />
                <span className="text-sm">
                    {scheduledDate?.date ? formatDateRu(scheduledDate.date) : 'Дата не назначена'}
                </span>
            </div>
            {scheduledDate && (
                <div className="flex items-center gap-2">
                    <ClockIcon className="size-5 shrink-0 text-base-content/40" />
                    <span className="text-sm text-base-content/60">
                        {scheduledDate.startHour}:
                        {String(scheduledDate.startMinute).padStart(2, '0')}
                        {' – '}
                        {scheduledDate.endHour}:{String(scheduledDate.endMinute).padStart(2, '0')}
                    </span>
                </div>
            )}
        </div>
    );
}

function ItemsCard({ order }: { order: TOrder }) {
    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-3">
            <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                Состав заказа
            </p>
            <OrderPositionsList cartState={order.cartState} imageUrls={{}} loadingIds={new Set()} />
            {order.cartState.totalRateOfHours != null && (
                <div className="flex items-center justify-between pt-1 border-t border-base-content/5">
                    <span className="text-sm text-base-content/60">Нормо-часы</span>
                    <span className="text-sm font-medium">
                        {order.cartState.totalRateOfHours} ч
                    </span>
                </div>
            )}
        </div>
    );
}

function PaymentCard({ order }: { order: TOrder }) {
    const masterEarnings = Math.round(order.totalAmount * (1 - COMMISSION_PERCENTS / 100));

    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-3">
            <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                Оплата
            </p>
            <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/60">Итого</span>
                <span className="text-sm font-semibold">{formatPrice(order.totalAmount)}</span>
            </div>
            {order.deliveryCost != null && order.deliveryCost > 0 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-base-content/60">Доставка</span>
                    <span className="text-sm">{formatPrice(order.deliveryCost)}</span>
                </div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-sm text-base-content/60">Мастер получит</span>
                    <span className="text-xs text-base-content/40">
                        После комиссии {COMMISSION_PERCENTS}%
                    </span>
                </div>
                <span className="text-sm font-medium text-success">
                    {formatPrice(masterEarnings)}
                </span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/60">Статус оплаты</span>
                <span className="badge badge-sm badge-ghost">{order.paymentStatus}</span>
            </div>
            {order.paidAt && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-base-content/60">Оплачен</span>
                    <span className="text-sm">{formatDateRu(order.paidAt)}</span>
                </div>
            )}
        </div>
    );
}

// ---- Управление заказом ----

function ManagementCard({ order }: { order: TOrder }) {
    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-4">
            <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                Управление
            </p>
            <StatusControl key={order.updatedAt} order={order} />
            <div className="divider my-0" />
            <ScheduleControl key={order.updatedAt} order={order} />
            <div className="divider my-0" />
            <Suspense
                fallback={
                    <div className="flex justify-center py-2">
                        <span className="loading loading-spinner loading-sm" />
                    </div>
                }
            >
                <ExecutorControl key={order.updatedAt} order={order} />
            </Suspense>
        </div>
    );
}

function StatusControl({ order }: { order: TOrder }) {
    const [value, setValue] = useState<EOrderStatus>(order.status);

    const { mutate, isPending } = useUpdateOrderStatus();
    const isDirty = value !== order.status;

    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Статус</span>
            <div className="flex gap-2">
                <select
                    className="select select-sm flex-1"
                    value={value}
                    onChange={(e) => setValue(e.target.value as EOrderStatus)}
                >
                    {Object.values(EOrderStatus).map((s) => (
                        <option key={s} value={s}>
                            {STATUS_LABEL[s].text}
                        </option>
                    ))}
                </select>
                <button
                    className="btn btn-sm btn-primary"
                    disabled={!isDirty || isPending}
                    onClick={() => mutate({ orderId: order.id, status: value })}
                >
                    {isPending ? (
                        <span className="loading loading-spinner loading-xs" />
                    ) : (
                        'Сохранить'
                    )}
                </button>
            </div>
        </div>
    );
}

const pad = (n: number) => String(n).padStart(2, '0');

function ScheduleControl({ order }: { order: TOrder }) {
    const sd = order.scheduledDate;
    const [date, setDate] = useState(sd?.date ?? '');
    const [startTime, setStartTime] = useState(
        sd ? `${pad(sd.startHour)}:${pad(sd.startMinute)}` : '09:00',
    );
    const [endTime, setEndTime] = useState(
        sd ? `${pad(sd.endHour)}:${pad(sd.endMinute)}` : '18:00',
    );

    const { mutate, isPending } = useUpdateOrderSchedule();

    const handleSave = () => {
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        mutate({
            orderId: order.id,
            scheduledDate: {
                date: date || null,
                startHour: sh,
                startMinute: sm,
                endHour: eh,
                endMinute: em,
            },
        });
    };

    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Дата и время</span>
            <input
                type="date"
                className="input input-sm w-full"
                value={date}
                onChange={(e) => setDate(e.target.value)}
            />
            <div className="flex items-center gap-2">
                <input
                    type="time"
                    className="input input-sm flex-1"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                />
                <span className="text-sm text-base-content/50">–</span>
                <input
                    type="time"
                    className="input input-sm flex-1"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                />
            </div>
            <button
                className="btn btn-sm btn-primary w-full"
                disabled={isPending}
                onClick={handleSave}
            >
                {isPending ? (
                    <span className="loading loading-spinner loading-xs" />
                ) : (
                    'Сохранить дату'
                )}
            </button>
        </div>
    );
}

function ExecutorControl({ order }: { order: TOrder }) {
    const { data } = useGetCuratorMasters({ limit: 100 });
    const masters = data.pages.flatMap((p) => p.items);

    const [executorId, setExecutorId] = useState(order.executor?.id ?? 0);

    const { mutate, isPending } = useUpdateOrderExecutor();
    const isDirty = executorId !== (order.executor?.id ?? 0);

    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Мастер</span>
            <div className="flex gap-2">
                <select
                    className="select select-sm flex-1"
                    value={executorId}
                    onChange={(e) => setExecutorId(Number(e.target.value))}
                >
                    <option value={0}>Не назначен</option>
                    {masters.map((m) => {
                        const name =
                            [m.first_name, m.last_name].filter(Boolean).join(' ') || `ID ${m.id}`;
                        return (
                            <option key={m.id} value={m.id}>
                                {name}
                            </option>
                        );
                    })}
                </select>
                <button
                    className="btn btn-sm btn-primary"
                    disabled={!isDirty || isPending || executorId === 0}
                    onClick={() => mutate({ orderId: order.id, executorId })}
                >
                    {isPending ? (
                        <span className="loading loading-spinner loading-xs" />
                    ) : (
                        'Сохранить'
                    )}
                </button>
            </div>
        </div>
    );
}
