'use client';

import Image from 'next/image';
import { PhoneIcon } from '@heroicons/react/24/outline';
import { HomeIcon, MapPinIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useGetOrderById, OrderPositionsList, STATUS_LABEL } from '@/entities/order';
import { CURATOR_ORDERS_PATH } from '@/shared/config';
import { formatDateRu, formatUserInitials } from '@/shared/lib';
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
                {order.client && <PersonCard label="Клиент" user={order.client} />}
                {order.executor && <PersonCard label="Мастер" user={order.executor} />}
                {!order.executor && <NoExecutorCard />}
                {order.realEstate && <AddressCard realEstate={order.realEstate} />}
                <ScheduleCard scheduledDate={order.scheduledDate} />
                {hasItems && <ItemsCard order={order} />}
                <PaymentCard order={order} />
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

function PersonCard({ label, user }: { label: string; user: TPersonCardUser }) {
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || `ID ${user.id}`;
    const initials = formatUserInitials(user.first_name, user.last_name);

    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-3">
            <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                {label}
            </p>
            <div className="flex items-center gap-3">
                <div className={`avatar shrink-0 ${!user.photo_url ? 'avatar-placeholder' : ''}`}>
                    <div className="relative size-10 rounded-full overflow-hidden bg-primary/10 text-primary">
                        {user.photo_url ? (
                            <Image src={user.photo_url} alt={name} fill className="object-cover" />
                        ) : (
                            <span className="text-sm font-semibold">{initials}</span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-medium text-sm leading-tight">{name}</span>
                    {user.phone && (
                        <a
                            href={`tel:${user.phone}`}
                            className="flex items-center gap-1 text-primary text-sm"
                        >
                            <PhoneIcon className="size-3.5" />
                            {user.phone}
                        </a>
                    )}
                </div>
            </div>
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
    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-3">
            <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                Оплата
            </p>
            <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/60">Итого</span>
                <span className="text-sm font-semibold">
                    {order.totalAmount.toLocaleString('ru-RU')} {order.currency}
                </span>
            </div>
            {order.deliveryCost != null && order.deliveryCost > 0 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-base-content/60">Доставка</span>
                    <span className="text-sm">
                        {order.deliveryCost.toLocaleString('ru-RU')} {order.currency}
                    </span>
                </div>
            )}
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
