import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/profile'];
const AUTH_ONLY_PATHS = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('access_token')?.value;
    const isAuthenticated = Boolean(token);

    const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    const isAuthOnly = AUTH_ONLY_PATHS.some((path) => pathname.startsWith(path));

    if (isProtected && !isAuthenticated) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('from', pathname);
        return NextResponse.redirect(url);
    }

    if (isAuthOnly && isAuthenticated) {
        const from = request.nextUrl.searchParams.get('from');
        const url = request.nextUrl.clone();
        url.pathname = from && from.startsWith('/') ? from : '/';
        url.search = '';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
};
