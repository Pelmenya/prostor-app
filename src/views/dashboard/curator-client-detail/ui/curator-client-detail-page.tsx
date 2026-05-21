'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useGetCuratorClientById } from '@/entities/user';
import { useGetOrders, OrderStatus } from '@/entities/order';
import { curatorOrderPath, CURATOR_CLIENTS_PATH } from '@/shared/config';
import { formatUserInitials, formatDateRu, formatRuPhoneForView } from '@/shared/lib';
import { PageContainer, DashboardBackHeader, QueryBoundary, SectionLabel } from '@/shared/ui';
import type { TCuratorUser } from '@/shared/model';
import type { TOrder } from '@/entities/order';

type TProps = {
    id: string;
};

export function CuratorClientDetailPage({ id }: TProps) {
    const userId = Number(id);

    return (
        <QueryBoundary errorMessage="Ошибка загрузки клиента" resetKeys={[userId]}>
            <CuratorClientDetailContent userId={userId} />
        </QueryBoundary>
    );
}

function CuratorClientDetailContent({ userId }: { userId: number }) {
    const { data: client } = useGetCuratorClientById(userId);
    const fullName = [client.first_name, client.last_name].filter(Boolean).join(' ') || '—';

    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader title={fullName} fallbackHref={CURATOR_CLIENTS_PATH} />
            <div className="flex flex-col gap-3 max-w-lg mx-auto py-4">
                <ProfileCard client={client} />
                <ContactsCard client={client} />
                <AccountCard client={client} />
                <QueryBoundary errorMessage="Ошибка загрузки заказов">
                    <OrdersCard userId={userId} />
                </QueryBoundary>
            </div>
        </PageContainer>
    );
}

function ProfileCard({ client }: { client: TCuratorUser }) {
    const initials = formatUserInitials(client.first_name, client.last_name);
    const fullName = [client.first_name, client.last_name].filter(Boolean).join(' ') || '—';
    const since = formatDateRu(client.created_at);

    return (
        <div className="card bg-base-100 p-4 flex flex-row items-center gap-4">
            <div className={`avatar shrink-0 ${!client.photo_url ? 'avatar-placeholder' : ''}`}>
                <div className="relative size-16 rounded-full overflow-hidden bg-primary/10 text-primary">
                    {client.photo_url ? (
                        <Image
                            src={client.photo_url}
                            alt={fullName}
                            fill
                            sizes="64px"
                            className="object-cover"
                        />
                    ) : (
                        <span className="text-xl font-semibold">{initials}</span>
                    )}
                </div>
            </div>
            <div>
                <p className="font-semibold text-base">{fullName}</p>
                <p className="text-sm text-base-content/60">Клиент</p>
                <p className="text-xs text-base-content/40 mt-0.5">С нами с {since}</p>
            </div>
        </div>
    );
}

function ContactsCard({ client }: { client: TCuratorUser }) {
    const phone = client.phone ? formatRuPhoneForView(client.phone) : null;

    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-3">
            <SectionLabel>Контакты</SectionLabel>
            {phone && (
                <ContactRow label="Телефон" value={phone} verified={client.phone_is_confirm} />
            )}
            {client.email && (
                <ContactRow label="Email" value={client.email} verified={client.email_is_confirm} />
            )}
            {client.username && <ContactRow label="Username" value={`@${client.username}`} />}
            {!phone && !client.email && !client.username && (
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

function AccountCard({ client }: { client: TCuratorUser }) {
    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-3">
            <SectionLabel>Аккаунт</SectionLabel>
            <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/60">Авторизован</span>
                <span
                    className={`badge badge-sm ${client.is_auth ? 'badge-success' : 'badge-ghost'}`}
                >
                    {client.is_auth ? 'Да' : 'Нет'}
                </span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/60">Онбординг</span>
                <span
                    className={`badge badge-sm ${client.hasSeenOnboarding ? 'badge-success badge-outline' : 'badge-ghost'}`}
                >
                    {client.hasSeenOnboarding ? 'Пройден' : 'Не пройден'}
                </span>
            </div>
        </div>
    );
}

function OrdersCard({ userId }: { userId: number }) {
    const { data } = useGetOrders({ clientId: userId, limit: 5 });
    const orders = data.pages.flatMap((p) => p.items);

    if (orders.length === 0) {
        return (
            <div className="card bg-base-100 p-4">
                <SectionLabel className="mb-3">Заказы</SectionLabel>
                <p className="text-sm text-base-content/40">Заказов нет</p>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-3">
            <SectionLabel>Заказы</SectionLabel>
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
