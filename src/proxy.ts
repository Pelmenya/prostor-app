import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PRIVATE_PATHS } from '@/shared/config';

function isPrivate(pathname: string): boolean {
    return PRIVATE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('access_token')?.value;

    // Авторизованный юзер на auth-страницах → на главную
    const AUTH_ONLY = ['/login', '/register', '/forgot-password', '/reset-password'];
    if (token && AUTH_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
        const from = request.nextUrl.searchParams.get('from');
        return NextResponse.redirect(
            new URL(from && from.startsWith('/') ? from : '/', request.url),
        );
    }

    // Приватные пути без токена → на /login
    if (isPrivate(pathname) && !token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
