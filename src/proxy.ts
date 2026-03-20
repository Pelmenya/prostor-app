import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PRIVATE_PATHS = ['/profile', '/orders', '/checkout'];

function isPrivate(pathname: string): boolean {
    return PRIVATE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('access_token')?.value;

    // Авторизованный юзер на /login или /register → на главную
    if (token && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/', request.url));
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
