'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    HomeIcon,
    UsersIcon,
    WrenchScrewdriverIcon,
    ClipboardDocumentListIcon,
    MapIcon,
    Cog6ToothIcon,
    ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';
import {
    CURATOR_PATH,
    CURATOR_CLIENTS_PATH,
    CURATOR_MASTERS_PATH,
    CURATOR_ORDERS_PATH,
    CURATOR_ZONES_PATH,
    CURATOR_SETTINGS_PATH,
    CURATOR_CHATS_PATH,
} from '@/shared/config';
import { useGetUnreadCount } from '@/entities/chat';
import { useGetOrdersCount, EOrderStatus } from '@/entities/order';
import { useAuth } from '@/shared/lib/platform';
import { formatUserInitials } from '@/shared/lib';

const NAV_ITEMS = [
    { href: CURATOR_PATH, icon: HomeIcon, label: 'Главная', exact: true },
    { href: CURATOR_CLIENTS_PATH, icon: UsersIcon, label: 'Клиенты', exact: false },
    { href: CURATOR_MASTERS_PATH, icon: WrenchScrewdriverIcon, label: 'Мастера', exact: false },
    { href: CURATOR_ORDERS_PATH, icon: ClipboardDocumentListIcon, label: 'Заказы', exact: false },
    {
        href: CURATOR_CHATS_PATH,
        icon: ChatBubbleLeftEllipsisIcon,
        label: 'Сообщения',
        exact: false,
    },
    { href: CURATOR_ZONES_PATH, icon: MapIcon, label: 'Зоны', exact: false },
    { href: CURATOR_SETTINGS_PATH, icon: Cog6ToothIcon, label: 'Настройки', exact: false },
];

export function CuratorSidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const { data: unreadData } = useGetUnreadCount(user?.id);
    const unreadCount = unreadData?.count ?? 0;
    const { data: pendingData } = useGetOrdersCount({ status: [EOrderStatus.PENDING] });
    const { data: inProgressData } = useGetOrdersCount({ status: [EOrderStatus.IN_PROGRESS] });
    const activeOrdersCount = (pendingData?.count ?? 0) + (inProgressData?.count ?? 0);

    return (
        <aside className="w-64 min-h-dvh bg-base-100 border-r border-base-content/10 flex flex-col">
            <div className="p-4 border-b border-base-content/10">
                <span className="text-lg font-bold gradient-text">PROSTOR</span>
                <p className="text-xs text-base-content/60 mt-0.5">Панель куратора</p>
            </div>

            <nav className="flex-1 p-2">
                <ul className="menu menu-sm gap-0.5 p-0">
                    {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
                        const isActive = exact
                            ? pathname === href
                            : pathname === href || pathname.startsWith(href + '/');
                        const isChats = href === CURATOR_CHATS_PATH;
                        const isOrders = href === CURATOR_ORDERS_PATH;
                        return (
                            <li key={href}>
                                <Link href={href} className={isActive ? 'active' : ''}>
                                    <Icon className="size-5" />
                                    {label}
                                    {isChats && unreadCount > 0 && (
                                        <span className="badge badge-primary badge-sm ml-auto">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                    {isOrders && activeOrdersCount > 0 && (
                                        <span className="badge badge-warning badge-sm ml-auto">
                                            {activeOrdersCount > 99 ? '99+' : activeOrdersCount}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {user && (
                <div className="p-4 border-t border-base-content/10">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="avatar avatar-placeholder shrink-0">
                            <div className="size-8 rounded-full bg-primary text-primary-content">
                                <span className="text-xs font-semibold">
                                    {formatUserInitials(user.firstName, user.lastName)}
                                </span>
                            </div>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-base-content/60">Куратор</p>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
