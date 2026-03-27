'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Transition } from '@headlessui/react';
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
import { formatUserInitials, useClickOutside } from '@/shared/lib';
import type { TPlatformUser } from '@/shared/lib/platform';
import { MenuLink } from './menu-link';

type TBurgerMenuUser = Pick<TPlatformUser, 'firstName' | 'lastName' | 'email'>;

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
    const { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe } =
        usePushNotifications();

    useClickOutside([menuRef, triggerRef], onClose, isOpen);

    const initials = formatUserInitials(user?.firstName, user?.lastName);
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || null;

    return (
        <Transition show={isOpen}>
            <div
                ref={menuRef}
                role="dialog"
                aria-label="Меню навигации"
                className="absolute top-full right-0 w-full sm:w-72 sm:right-4 bg-base-100 shadow-md z-20 rounded-b-xl sm:rounded-xl outline-1 outline-base-content/15 overflow-hidden transition duration-150 ease-out data-[closed]:opacity-0 data-[closed]:-translate-y-2 data-[leave]:duration-100 data-[leave]:ease-in"
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
                                <div className="ring-primary ring-offset-base-100 size-9 rounded-full ring-2 ring-offset-2 bg-primary text-primary-content">
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
                        <MenuLink
                            href="/orders"
                            icon={ClipboardDocumentListIcon}
                            label="Заказы"
                            onClick={onClose}
                        />
                        <hr className="border-base-content/10" />
                        <MenuLink
                            href="/real-estate"
                            icon={HomeModernIcon}
                            label="Мои адреса"
                            onClick={onClose}
                        />
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
                        <MenuLink
                            href={`/login?from=${encodeURIComponent(pathname)}`}
                            icon={UserIcon}
                            label="Войти"
                            onClick={onClose}
                        />
                        <hr className="border-base-content/10" />
                        <MenuLink
                            href={`/register?from=${encodeURIComponent(pathname)}`}
                            icon={UserPlusIcon}
                            label="Регистрация"
                            onClick={onClose}
                        />
                    </>
                )}
            </div>
        </Transition>
    );
}
