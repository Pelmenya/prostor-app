'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/shared/lib/platform';
import { useAuthStore } from '@/shared/lib';
import { webLogout } from '@/features/auth';
import { PushToggle } from '@/features/push-notifications';

type THeaderProps = {
    back?: boolean;
    backTo?: string;
};

export function Header({ back = false, backTo }: THeaderProps) {
    const router = useRouter();
    const { isAuthenticated, user, logout } = useAuth();
    const { accessToken, refreshToken } = useAuthStore();

    // Предотвращение hydration mismatch: SSR = false, клиент = true
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );

    const showAuth = mounted && isAuthenticated;
    const showUser = mounted && isAuthenticated && user;

    const handleLogout = async () => {
        if (accessToken && refreshToken) {
            try {
                await webLogout(accessToken, refreshToken);
            } catch {
                // Игнорируем — главное очистить локальное состояние
            }
        }
        logout();
        router.push('/');
    };

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
                        <>
                            <div className={`avatar avatar-placeholder ${!back ? 'ml-1' : ''}`}>
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
                        </>
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
                    {showAuth ? (
                        <>
                            <PushToggle />
                            <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                                Выйти
                            </button>
                        </>
                    ) : mounted ? (
                        <>
                            <Link href="/login" className="btn btn-primary btn-sm">
                                Войти
                            </Link>
                            <Link
                                href="/register"
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
