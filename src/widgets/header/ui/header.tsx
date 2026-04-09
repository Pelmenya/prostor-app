'use client';

import { useState, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeftIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useAuth } from '@/shared/lib/platform';
import { useLogout } from '@/features/auth';
import { flushCartSync } from '@/features/cart';
import { formatUserInitials } from '@/shared/lib';
import { BurgerMenu } from './burger-menu';

const NOOP_SUBSCRIBE = () => () => {};

/** Паттерны роутов, которые показывают стрелку назад */
const BACK_PATTERNS: RegExp[] = [
    /^\/real-estate\/\d+/,
    /^\/real-estate\/add$/,
    /^\/orders\/\d+/,
    /^\/product\/[^/]+/,
    /^\/catalog\/[^/]+/,
    /^\/profile\/.+/,
    /^\/checkout$/,
];

function shouldShowBack(pathname: string): boolean {
    return BACK_PATTERNS.some((pattern) => pattern.test(pathname));
}

type THeaderProps = {
    back?: boolean;
    backTo?: string;
};

export function Header({ back: backProp, backTo }: THeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const back = backProp ?? shouldShowBack(pathname);
    const { isAuthenticated, user } = useAuth();
    const logout = useLogout();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const burgerRef = useRef<HTMLButtonElement>(null);

    // Предотвращение hydration mismatch: SSR = false, клиент = true
    const mounted = useSyncExternalStore(
        NOOP_SUBSCRIBE,
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
                    <Link
                        href="/catalog"
                        className={`text-lg font-bold gradient-text ${!back ? 'ml-1' : ''}`}
                    >
                        PROSTOR
                    </Link>
                </div>

                <div className="navbar-end w-auto">
                    <button
                        ref={burgerRef}
                        aria-label="Меню"
                        aria-expanded={isMenuOpen}
                        aria-haspopup="true"
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                        className="size-10 flex items-center justify-center cursor-pointer hover:opacity-80"
                    >
                        {!mounted ? (
                            <div className="skeleton size-8 rounded-full" />
                        ) : showUser ? (
                            <div className="avatar avatar-placeholder">
                                <div className="ring-primary ring-offset-base-100 size-8 rounded-full ring-2 ring-offset-2 bg-primary text-primary-content">
                                    <span className="font-semibold text-sm">
                                        {formatUserInitials(user.firstName, user.lastName)}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <Bars3Icon className="size-6" />
                        )}
                    </button>
                </div>
            </div>

            <BurgerMenu
                isOpen={isMenuOpen}
                isAuthenticated={!!showAuth}
                user={user ?? null}
                onClose={() => setIsMenuOpen(false)}
                onLogout={() => logout(flushCartSync)}
                triggerRef={burgerRef}
            />
        </header>
    );
}
