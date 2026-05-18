'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRightIcon, StarIcon } from '@heroicons/react/24/solid';
import { useGetCuratorServiceById, useSetMasterCanEdit } from '@/entities/user';
import { useGetOrders, OrderStatus } from '@/entities/order';
import { curatorOrderPath, CURATOR_MASTERS_PATH } from '@/shared/config';
import { formatUserInitials, formatDateRu, formatRuPhoneForView } from '@/shared/lib';
import { PageContainer, DashboardBackHeader, QueryBoundary } from '@/shared/ui';
import type { TCuratorServiceUser, TCuratorMasterAccountService } from '@/shared/model';
import type { TOrder } from '@/entities/order';

const GRADE_LABELS: Record<string, string> = {
    courier: 'Курьер',
    specialist: 'Специалист',
    senior_specialist: 'Старший специалист',
    master: 'Мастер',
};

type TProps = { id: string };

export function CuratorMasterDetailPage({ id }: TProps) {
    const userId = Number(id);
    return (
        <QueryBoundary errorMessage="Ошибка загрузки мастера" resetKeys={[userId]}>
            <CuratorMasterDetailContent userId={userId} />
        </QueryBoundary>
    );
}

function CuratorMasterDetailContent({ userId }: { userId: number }) {
    const { data: master } = useGetCuratorServiceById(userId);
    const fullName = [master.first_name, master.last_name].filter(Boolean).join(' ') || '—';

    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader title={fullName} fallbackHref={CURATOR_MASTERS_PATH} />
            <div className="flex flex-col gap-3 max-w-lg mx-auto py-4">
                <ProfileCard master={master} />
                <ContactsCard master={master} />
                <ManagementCard master={master} userId={userId} />
                {master.accountService && <TransportCard as={master.accountService} />}
                <QueryBoundary errorMessage="Ошибка загрузки заказов">
                    <OrdersCard userId={userId} />
                </QueryBoundary>
            </div>
        </PageContainer>
    );
}

function ProfileCard({ master }: { master: TCuratorServiceUser }) {
    const initials = formatUserInitials(master.first_name, master.last_name);
    const fullName = [master.first_name, master.last_name].filter(Boolean).join(' ') || '—';
    const since = formatDateRu(master.created_at);
    const as = master.accountService;
    const gradeLabel = as?.grade ? (GRADE_LABELS[as.grade] ?? as.grade) : null;

    return (
        <div className="card bg-base-100 p-4 flex flex-row items-center gap-4">
            <div className={`avatar shrink-0 ${!master.photo_url ? 'avatar-placeholder' : ''}`}>
                <div
                    className={`relative size-16 rounded-full overflow-hidden ${!master.photo_url ? (as?.isEnabled ? 'bg-primary/10 text-primary' : 'bg-base-300 text-base-content/40') : ''}`}
                >
                    {master.photo_url ? (
                        <Image
                            src={master.photo_url}
                            alt={fullName}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <span className="text-xl font-semibold">{initials}</span>
                    )}
                </div>
            </div>
            <div>
                <p className="font-semibold text-base">{fullName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    {gradeLabel && <span className="badge badge-sm badge-ghost">{gradeLabel}</span>}
                    {master.avgRating != null && master.avgRating > 0 && (
                        <span className="flex items-center gap-0.5 text-sm text-warning font-medium">
                            <StarIcon className="size-4" />
                            {master.avgRating.toFixed(1)}
                        </span>
                    )}
                </div>
                <p className="text-xs text-base-content/40 mt-1">С нами с {since}</p>
            </div>
        </div>
    );
}

function ContactsCard({ master }: { master: TCuratorServiceUser }) {
    const phone = master.phone ? formatRuPhoneForView(master.phone) : null;

    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-3">
            <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                Контакты
            </p>
            {phone && (
                <ContactRow label="Телефон" value={phone} verified={master.phone_is_confirm} />
            )}
            {master.email && (
                <ContactRow label="Email" value={master.email} verified={master.email_is_confirm} />
            )}
            {master.username && <ContactRow label="Username" value={`@${master.username}`} />}
            {!phone && !master.email && !master.username && (
                <p className="text-sm text-base-content/40">Контакты не указаны</p>
            )}
        </div>
    );
}

function ContactRow({
    label,
    value,
    verified,
}: {
    label: string;
    value: string;
    verified?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-base-content/60 shrink-0">{label}</span>
            <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm truncate">{value}</span>
                {verified !== undefined && (
                    <span
                        className={`badge badge-xs shrink-0 ${verified ? 'badge-success' : 'badge-ghost'}`}
                    >
                        {verified ? '✓' : '✗'}
                    </span>
                )}
            </div>
        </div>
    );
}

function ManagementCard({ master, userId }: { master: TCuratorServiceUser; userId: number }) {
    const { mutate: setCanEdit, isPending } = useSetMasterCanEdit();
    const as = master.accountService;

    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-3">
            <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                Управление
            </p>

            <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/60">Статус</span>
                <span
                    className={`badge badge-sm ${as?.isEnabled ? 'badge-success' : 'badge-error badge-outline'}`}
                >
                    {as?.isEnabled ? 'Активен' : 'Неактивен'}
                </span>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-sm text-base-content/60">Редактирует сам</span>
                    <span className="text-xs text-base-content/40">
                        Разрешить изменять настройки профиля
                    </span>
                </div>
                <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm"
                    checked={as?.canEdit ?? false}
                    disabled={isPending || !as}
                    onChange={(e) => setCanEdit({ userId, canEdit: e.target.checked })}
                />
            </div>
        </div>
    );
}

function TransportCard({ as }: { as: TCuratorMasterAccountService }) {
    const hasInfo = as.carModel || as.carNumber || as.address;
    if (!hasInfo) return null;

    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-3">
            <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                Транспорт и адрес
            </p>
            {as.carModel && (
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-base-content/60 shrink-0">Автомобиль</span>
                    <span className="text-sm">{as.carModel}</span>
                </div>
            )}
            {as.carNumber && (
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-base-content/60 shrink-0">Номер</span>
                    <span className="text-sm font-mono">{as.carNumber}</span>
                </div>
            )}
            {as.address && (
                <div className="flex items-start justify-between gap-2">
                    <span className="text-sm text-base-content/60 shrink-0">Адрес</span>
                    <span className="text-sm text-right">{as.address}</span>
                </div>
            )}
        </div>
    );
}

function OrdersCard({ userId }: { userId: number }) {
    const { data } = useGetOrders({ executorId: userId, limit: 5 });
    const orders = data.pages.flatMap((p) => p.items);

    if (orders.length === 0) {
        return (
            <div className="card bg-base-100 p-4">
                <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide mb-3">
                    Заказы
                </p>
                <p className="text-sm text-base-content/40">Заказов нет</p>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-3">
            <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                Заказы
            </p>
            <ul className="flex flex-col divide-y divide-base-content/5">
                {orders.map((order) => (
                    <OrderRow key={order.id} order={order} />
                ))}
            </ul>
        </div>
    );
}

function OrderRow({ order }: { order: TOrder }) {
    return (
        <li>
            <Link
                href={curatorOrderPath(order.id)}
                className="flex items-center justify-between gap-3 py-2.5 hover:opacity-70 transition-opacity"
            >
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">Заказ #{order.id}</span>
                    <span className="text-xs text-base-content/40">
                        {formatDateRu(order.createdAt)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <OrderStatus status={order.status} />
                    <ChevronRightIcon className="size-4 text-base-content/30 shrink-0" />
                </div>
            </Link>
        </li>
    );
}
