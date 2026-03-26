'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/shared/lib/platform';
import { useLogout } from '@/features/auth';
import { flushCartSync } from '@/features/cart';
import { PushToggle } from '@/features/push-notifications';
import { ThemeToggle } from '@/shared/ui';

type THeaderProps = {
    back?: boolean;
    backTo?: string;
};

export function Header({ back = false, backTo }: THeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, user } = useAuth();
    const logout = useLogout();
    const handleLogout = () => logout(flushCartSync);

    // Предотвращение hydration mismatch: SSR = false, клиент = true
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );

    const showAuth = mounted && isAuthenticated;
    const showUser = mounted && isAuthenticated && user;

    return (
        <header className="relative z-10 shrink-0 bg-base-100 border-b border-base-content/10 shadow-sm">
            <div className="navbar px-4 py-2">
                <div className="navbar-start gap-2 w-auto flex-1 min-w-0">
                    {back && (
                        <button
                            aria-label="Назад"
                            onClick={() => (backTo ? router.push(backTo) : router.back())}
                            className="size-10 flex items-center justify-center cursor-pointer hover:opacity-80"
                        >
                            <ArrowLeftIcon className="size-5" />
                        </button>
                    )}

                    {showUser ? (
                        <Link
                            href="/profile"
                            className={`flex items-center gap-2 min-w-0 active:opacity-70 ${!back ? 'ml-1' : ''}`}
                        >
                            <div className="avatar avatar-placeholder shrink-0">
                                <div className="ring-primary ring-offset-base-100 size-6 rounded-full ring-1 ring-offset-2 bg-primary text-primary-content sm:size-8 md:size-12 lg:size-16">
                                    <span className="font-semibold text-xs sm:text-sm md:text-base">
                                        {(user.firstName?.charAt(0) ?? '?') +
                                            (user.lastName?.charAt(0) ?? '')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col overflow-hidden font-medium min-w-0">
                                <p className="text-sm whitespace-nowrap overflow-hidden text-ellipsis md:text-base lg:text-lg">
                                    {user.firstName} {user.lastName}
                                </p>
                            </div>
                        </Link>
                    ) : (
                        <Link
                            href="/catalog"
                            className={`text-lg font-bold gradient-text ${!back ? 'ml-1' : ''}`}
                        >
                            PROSTOR
                        </Link>
                    )}
                </div>

                <div className="navbar-end gap-2 w-auto">
                    <ThemeToggle />
                    {showAuth ? (
                        <>
                            <PushToggle />
                            <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                                Выйти
                            </button>
                        </>
                    ) : mounted ? (
                        <>
                            <Link
                                href={`/login?from=${encodeURIComponent(pathname)}`}
                                className="btn btn-primary btn-sm"
                            >
                                Войти
                            </Link>
                            <Link
                                href={`/register?from=${encodeURIComponent(pathname)}`}
                                className="btn btn-ghost btn-sm hidden sm:inline-flex"
                            >
                                Регистрация
                            </Link>
                        </>
                    ) : null}
                </div>
            </div>
        </header>
    );
}
