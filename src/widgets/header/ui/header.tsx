'use client';

import { useState, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeftIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useAuth } from '@/shared/lib/platform';
import { useLogout } from '@/features/auth';
import { flushCartSync } from '@/features/cart';
import { formatUserInitials, useAuthStore } from '@/shared/lib';
import { IconButton } from '@/shared/ui';
import { SearchButton, isCatalogRoute } from '@/features/product-search';
import { BurgerMenu } from './burger-menu';
import { getBackDestination } from '../lib/get-back-destination';

const NOOP_SUBSCRIBE = () => () => {};

type THeaderProps = {
    back?: boolean;
    backTo?: string;
};

export function Header({ back: backProp, backTo: backToProp }: THeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const autoBackTo = getBackDestination(pathname);
    const back = backProp ?? autoBackTo !== null;
    const backTo = backToProp ?? autoBackTo ?? undefined;
    const { isAuthenticated, user } = useAuth();
    const role = useAuthStore((s) => s.user?.role);
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
        <header className="relative z-50 shrink-0 bg-base-100 border-b border-base-content/10 shadow-sm">
            <div className="navbar px-4 py-2">
                <div className="navbar-start gap-2 w-auto flex-1 min-w-0">
                    {back && (
                        <IconButton
                            aria-label="Назад"
                            onClick={() => (backTo ? router.push(backTo) : router.back())}
                        >
                            <ArrowLeftIcon className="size-5" />
                        </IconButton>
                    )}
                    <Link
                        href="/catalog"
                        className={`text-lg font-bold gradient-text ${!back ? 'ml-1' : ''}`}
                    >
                        PROSTOR
                    </Link>
                </div>

                <div className="navbar-end">
                    {isCatalogRoute(pathname) && <SearchButton />}
                    <IconButton
                        ref={burgerRef}
                        aria-label="Меню"
                        aria-expanded={isMenuOpen}
                        aria-haspopup="true"
                        onClick={() => setIsMenuOpen((prev) => !prev)}
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
                    </IconButton>
                </div>
            </div>

            <BurgerMenu
                isOpen={isMenuOpen}
                isAuthenticated={!!showAuth}
                user={user ?? null}
                role={mounted ? role : null}
                onClose={() => setIsMenuOpen(false)}
                onLogout={() => logout(flushCartSync)}
                triggerRef={burgerRef}
            />
        </header>
    );
}
