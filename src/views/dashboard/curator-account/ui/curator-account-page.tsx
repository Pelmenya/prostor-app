'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import {
    ClipboardDocumentListIcon,
    UserGroupIcon,
    UsersIcon,
    MapIcon,
    ChatBubbleLeftEllipsisIcon,
    ChevronRightIcon,
    ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import {
    useGetOrders,
    useGetOrdersCount,
    EOrderStatus,
    EDeliveryType,
    OrderStatus,
} from '@/entities/order';
import { useGetCuratorUsersCount } from '@/entities/user';
import { EUserRole } from '@/shared/model';
import {
    CURATOR_ORDERS_PATH,
    CURATOR_MASTERS_PATH,
    CURATOR_CLIENTS_PATH,
    CURATOR_ZONES_PATH,
    CURATOR_CHATS_PATH,
    curatorOrderPath,
} from '@/shared/config';
import { useGetUnreadCount } from '@/entities/chat';
import { formatDateRu } from '@/shared/lib';
import { useAuth } from '@/shared/lib/platform';
import { PageContainer, PageTitle, QueryBoundary, SectionLabel } from '@/shared/ui';
import type { TOrder } from '@/entities/order';

export function CuratorAccountPage() {
    return (
        <PageContainer bg="bg-base-200">
            <PageTitle>Обзор</PageTitle>
            <div className="flex flex-col gap-4 max-w-lg mx-auto pb-6">
                <StatsBlock />
                <QueryBoundary errorMessage="Ошибка загрузки заказов">
                    <AttentionBlock />
                </QueryBoundary>
                <QuickNavBlock />
            </div>
        </PageContainer>
    );
}

// ─── Статистика ───────────────────────────────────────────────────────────────

function StatsBlock() {
    const pending = useGetOrdersCount({ status: [EOrderStatus.PENDING] });
    const inProgress = useGetOrdersCount({ status: [EOrderStatus.IN_PROGRESS] });
    const completed = useGetOrdersCount({ status: [EOrderStatus.COMPLETED] });
    const masters = useGetCuratorUsersCount({ role: [EUserRole.SERVICE] });

    const stats = [
        {
            label: 'Ждут назначения',
            value: pending.data?.count,
            loading: pending.isLoading,
            accent: (pending.data?.count ?? 0) > 0,
        },
        {
            label: 'В работе',
            value: inProgress.data?.count,
            loading: inProgress.isLoading,
        },
        {
            label: 'Завершено',
            value: completed.data?.count,
            loading: completed.isLoading,
        },
        {
            label: 'Мастеров',
            value: masters.data?.count,
            loading: masters.isLoading,
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
                <div key={stat.label} className="card bg-base-100 p-4 flex flex-col gap-1">
                    <span className="text-xs text-base-content/50">{stat.label}</span>
                    {stat.loading ? (
                        <span className="loading loading-dots loading-xs text-base-content/30" />
                    ) : (
                        <span className={`text-2xl font-bold ${stat.accent ? 'text-warning' : ''}`}>
                            {stat.value ?? '—'}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Требуют внимания ─────────────────────────────────────────────────────────

function AttentionBlock() {
    return (
        <div className="card bg-base-100 flex flex-col">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <SectionLabel>Требуют внимания</SectionLabel>
                <Link
                    href={`${CURATOR_ORDERS_PATH}?status=pending`}
                    className="text-xs text-primary"
                >
                    Все ожидающие
                </Link>
            </div>

            <Suspense fallback={<AttentionSkeleton />}>
                <TCDeliveryList />
                <PendingOrdersList />
            </Suspense>

            <UnreadMessagesRow />
        </div>
    );
}

function TCDeliveryList() {
    const { data } = useGetOrders({ status: [EOrderStatus.PENDING], limit: 20 });
    const orders = data.pages
        .flatMap((p) => p.items)
        .filter(
            (o) => o.deliveryType === EDeliveryType.TRANSPORT_COMPANY && o.deliveryCost == null,
        );

    if (orders.length === 0) return null;

    return (
        <>
            <div className="px-4 pt-2 pb-1">
                <span className="text-xs font-semibold text-warning">
                    🚚 Ожидают расчёта доставки ТК
                </span>
            </div>
            <ul className="divide-y divide-base-content/5">
                {orders.map((order) => (
                    <li key={order.id}>
                        <Link
                            href={curatorOrderPath(order.id)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors"
                        >
                            <ExclamationCircleIcon className="size-5 text-warning shrink-0" />
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <span className="text-sm font-medium">Заказ #{order.id}</span>
                                <span className="text-xs text-base-content/40 truncate">
                                    {order.realEstate?.address ?? formatDateRu(order.createdAt)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="badge badge-xs badge-warning">нет доставки</span>
                                <OrderStatus status={order.status} />
                                <ChevronRightIcon className="size-4 text-base-content/30" />
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </>
    );
}

function PendingOrdersList() {
    const { data } = useGetOrders({ status: [EOrderStatus.PENDING], limit: 5 });
    const orders = data.pages.flatMap((p) => p.items);

    if (orders.length === 0) {
        return (
            <div className="px-4 py-6 text-center">
                <p className="text-sm text-base-content/40">Нет заказов, ожидающих обработки</p>
            </div>
        );
    }

    return (
        <ul className="divide-y divide-base-content/5">
            {orders.map((order) => (
                <PendingOrderRow key={order.id} order={order} />
            ))}
        </ul>
    );
}

function PendingOrderRow({ order }: { order: TOrder }) {
    const hasNoExecutor = !order.executor;

    return (
        <li>
            <Link
                href={curatorOrderPath(order.id)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors"
            >
                {hasNoExecutor && (
                    <ExclamationCircleIcon className="size-5 text-warning shrink-0" />
                )}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="text-sm font-medium">Заказ #{order.id}</span>
                    <span className="text-xs text-base-content/40 truncate">
                        {order.realEstate?.address ?? formatDateRu(order.createdAt)}
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {hasNoExecutor && (
                        <span className="badge badge-xs badge-warning">без мастера</span>
                    )}
                    <OrderStatus status={order.status} />
                    <ChevronRightIcon className="size-4 text-base-content/30" />
                </div>
            </Link>
        </li>
    );
}

function UnreadMessagesRow() {
    const { user } = useAuth();
    const { data, isLoading } = useGetUnreadCount(user?.id);
    const count = data?.count ?? 0;

    return (
        <Link
            href={CURATOR_CHATS_PATH}
            className="px-4 py-3 border-t border-base-content/5 flex items-center gap-3 hover:bg-base-200 transition-colors"
        >
            <ChatBubbleLeftEllipsisIcon className="size-5 shrink-0 text-base-content/60" />
            <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm">Новые сообщения в чате</span>
                {isLoading ? (
                    <span className="loading loading-dots loading-xs text-base-content/30" />
                ) : (
                    <span className="text-xs text-base-content/40">
                        {count > 0 ? `${count} непрочитанных` : 'Нет непрочитанных'}
                    </span>
                )}
            </div>
            {count > 0 && (
                <span className="badge badge-primary badge-sm shrink-0">
                    {count > 99 ? '99+' : count}
                </span>
            )}
            <ChevronRightIcon className="size-4 text-base-content/30 shrink-0" />
        </Link>
    );
}

function AttentionSkeleton() {
    return (
        <div className="flex flex-col divide-y divide-base-content/5">
            {[1, 2, 3].map((i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className="skeleton h-4 w-24 rounded" />
                    <div className="flex-1" />
                    <div className="skeleton h-4 w-16 rounded" />
                </div>
            ))}
        </div>
    );
}

// ─── Быстрая навигация ────────────────────────────────────────────────────────

const NAV_ITEMS = [
    { href: CURATOR_ORDERS_PATH, label: 'Заказы', icon: ClipboardDocumentListIcon },
    { href: CURATOR_MASTERS_PATH, label: 'Мастера', icon: UserGroupIcon },
    { href: CURATOR_CLIENTS_PATH, label: 'Клиенты', icon: UsersIcon },
    { href: CURATOR_ZONES_PATH, label: 'Зоны', icon: MapIcon },
];

function QuickNavBlock() {
    return (
        <div className="grid grid-cols-4 gap-3">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                    key={href}
                    href={href}
                    className="card bg-base-100 p-3 flex flex-col items-center gap-2 hover:bg-base-200 transition-colors"
                >
                    <Icon className="size-6 text-base-content/60" />
                    <span className="text-xs text-center text-base-content/70">{label}</span>
                </Link>
            ))}
        </div>
    );
}
