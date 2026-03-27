'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    UserIcon,
    MoonIcon,
    BellIcon,
    ClipboardDocumentListIcon,
    HomeModernIcon,
    ArrowRightOnRectangleIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import { ThemeToggle } from '@/shared/ui';
import { usePushNotifications } from '@/features/push-notifications';

type TBurgerMenuUser = {
    firstName?: string;
    lastName?: string;
    email?: string;
};

type TBurgerMenuProps = {
    isOpen: boolean;
    isAuthenticated: boolean;
    user: TBurgerMenuUser | null;
    onClose: () => void;
    onLogout: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
};

export function BurgerMenu({
    isOpen,
    isAuthenticated,
    user,
    onClose,
    onLogout,
    triggerRef,
}: TBurgerMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        if (!isOpen) return;

        const handleClick = (e: MouseEvent) => {
            const target = e.target as Node;
            const outsideMenu = !menuRef.current?.contains(target);
            const outsideTrigger = !triggerRef.current?.contains(target);
            if (outsideMenu && outsideTrigger) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen, onClose, triggerRef]);

    const { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe } =
        usePushNotifications();

    if (!isOpen) return null;

    const initials = (user?.firstName?.charAt(0) ?? '') + (user?.lastName?.charAt(0) ?? '') || '?';
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || null;

    return (
        <div
            ref={menuRef}
            className="absolute top-full right-0 w-full sm:w-72 sm:right-4 bg-base-100 shadow-md z-20 sm:rounded-xl outline-1 outline-base-content/15 overflow-hidden"
        >
            {isAuthenticated ? (
                <>
                    {/* Профиль */}
                    <Link
                        href="/profile"
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 active:bg-base-200 transition-colors"
                    >
                        <div className="avatar avatar-placeholder shrink-0">
                            <div className="size-9 rounded-full bg-primary text-primary-content flex items-center justify-center">
                                <span className="font-semibold text-sm">{initials}</span>
                            </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                            {fullName && (
                                <span className="text-sm font-medium truncate">{fullName}</span>
                            )}
                            {user?.email && (
                                <span className="text-xs text-base-content/50 truncate">
                                    {user.email}
                                </span>
                            )}
                        </div>
                    </Link>
                    <hr className="border-base-content/10" />

                    {/* Навигация */}
                    <Link
                        href="/orders"
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 active:bg-base-200 transition-colors"
                    >
                        <ClipboardDocumentListIcon className="size-5 shrink-0 text-base-content/70" />
                        <span className="text-sm">Заказы</span>
                    </Link>
                    <hr className="border-base-content/10" />
                    <Link
                        href="/real-estate"
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 active:bg-base-200 transition-colors"
                    >
                        <HomeModernIcon className="size-5 shrink-0 text-base-content/70" />
                        <span className="text-sm">Объекты недвижимости</span>
                    </Link>
                    <hr className="border-base-content/10" />
                </>
            ) : null}

            {/* Настройки */}
            <div className="flex items-center gap-3 px-4 py-3">
                <MoonIcon className="size-5 shrink-0 text-base-content/70" />
                <span className="text-sm flex-1">Тёмная тема</span>
                <ThemeToggle />
            </div>

            {isSupported && (
                <>
                    <hr className="border-base-content/10" />
                    <div className="flex items-center gap-3 px-4 py-3">
                        <BellIcon className="size-5 shrink-0 text-base-content/70" />
                        <span className="text-sm flex-1">Уведомления</span>
                        {permission === 'denied' ? (
                            <span className="text-xs text-error">Заблокированы</span>
                        ) : (
                            <input
                                type="checkbox"
                                className="toggle toggle-primary toggle-sm"
                                checked={isSubscribed}
                                disabled={isLoading}
                                onChange={isSubscribed ? unsubscribe : subscribe}
                                aria-label="Уведомления"
                            />
                        )}
                    </div>
                </>
            )}

            <hr className="border-base-content/10" />

            {/* Авторизация */}
            {isAuthenticated ? (
                <button
                    onClick={() => {
                        onLogout();
                        onClose();
                    }}
                    className="flex items-center gap-3 px-4 py-3 w-full hover:bg-base-200 active:bg-base-200 transition-colors text-error"
                >
                    <ArrowRightOnRectangleIcon className="size-5 shrink-0" />
                    <span className="text-sm">Выйти</span>
                </button>
            ) : (
                <>
                    <Link
                        href={`/login?from=${encodeURIComponent(pathname)}`}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 active:bg-base-200 transition-colors"
                    >
                        <UserIcon className="size-5 shrink-0 text-base-content/70" />
                        <span className="text-sm">Войти</span>
                    </Link>
                    <hr className="border-base-content/10" />
                    <Link
                        href={`/register?from=${encodeURIComponent(pathname)}`}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 active:bg-base-200 transition-colors"
                    >
                        <UserPlusIcon className="size-5 shrink-0 text-base-content/70" />
                        <span className="text-sm">Регистрация</span>
                    </Link>
                </>
            )}
        </div>
    );
}
