'use client';

import Link from 'next/link';
import { useAuth } from '@/shared/lib/platform';

export function Header() {
    const { isAuthenticated, user } = useAuth();

    return (
        <header className="navbar bg-base-100 shadow-sm px-4 md:px-6 xl:px-10">
            <div className="navbar-start">
                <Link href="/catalog" className="text-lg font-bold gradient-text">
                    PROSTOR
                </Link>
            </div>

            <nav className="navbar-center hidden sm:flex">
                <ul className="menu menu-horizontal gap-1 text-sm">
                    <li>
                        <Link href="/catalog" className="font-medium">
                            Каталог
                        </Link>
                    </li>
                </ul>
            </nav>

            <div className="navbar-end gap-2">
                {isAuthenticated && user ? (
                    <div className="flex items-center gap-2">
                        <div className="avatar placeholder">
                            <div className="size-8 rounded-full bg-primary text-primary-content md:size-10">
                                <span className="text-sm">{user.firstName?.charAt(0) ?? '?'}</span>
                            </div>
                        </div>
                        <span className="hidden text-sm font-medium sm:inline">
                            {user.firstName}
                        </span>
                    </div>
                ) : (
                    <Link href="/login" className="btn btn-primary btn-sm">
                        Войти
                    </Link>
                )}
            </div>
        </header>
    );
}
