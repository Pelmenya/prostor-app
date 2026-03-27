import { describe, it, expect, vi } from 'vitest';
import { proxy } from './proxy';

const BASE_URL = process.env.NEXT_PUBLIC_WEB_APP_URL ?? 'http://localhost:3050';

/** Мок NextRequest — реальный NextRequest не парсит cookies в happy-dom */
function createMockRequest(pathname: string, token?: string) {
    const url = new URL(pathname, BASE_URL);
    return {
        url: url.toString(),
        nextUrl: url,
        cookies: {
            get: (name: string) =>
                name === 'access_token' && token ? { value: token } : undefined,
        },
    } as unknown as Parameters<typeof proxy>[0];
}

describe('proxy', () => {
    // ─── Публичные страницы ─────────────────────────────────────

    it('пропускает гостя на публичные страницы', () => {
        const res = proxy(createMockRequest('/catalog'));
        expect(res.headers.get('x-middleware-next')).toBe('1');
    });

    it('пропускает залогиненного на публичные страницы', () => {
        const res = proxy(createMockRequest('/catalog', 'jwt-token'));
        expect(res.headers.get('x-middleware-next')).toBe('1');
    });

    // ─── AUTH_ONLY (гость может, залогиненный — нет) ────────────

    it('пропускает гостя на /login', () => {
        const res = proxy(createMockRequest('/login'));
        expect(res.headers.get('x-middleware-next')).toBe('1');
    });

    it('редиректит залогиненного с /login на /', () => {
        const res = proxy(createMockRequest('/login', 'jwt-token'));
        expect(res.status).toBe(307);
        expect(new URL(res.headers.get('location')!).pathname).toBe('/');
    });

    it('редиректит залогиненного с /register на /', () => {
        const res = proxy(createMockRequest('/register', 'jwt-token'));
        expect(res.status).toBe(307);
        expect(new URL(res.headers.get('location')!).pathname).toBe('/');
    });

    it('редиректит залогиненного с /forgot-password на /', () => {
        const res = proxy(createMockRequest('/forgot-password', 'jwt-token'));
        expect(res.status).toBe(307);
        expect(new URL(res.headers.get('location')!).pathname).toBe('/');
    });

    it('редиректит залогиненного с /reset-password на /', () => {
        const res = proxy(createMockRequest('/reset-password', 'jwt-token'));
        expect(res.status).toBe(307);
        expect(new URL(res.headers.get('location')!).pathname).toBe('/');
    });

    it('использует ?from для редиректа залогиненного', () => {
        const res = proxy(createMockRequest('/login?from=/profile', 'jwt-token'));
        expect(res.status).toBe(307);
        expect(new URL(res.headers.get('location')!).pathname).toBe('/profile');
    });

    it('игнорирует внешние URL в ?from', () => {
        const res = proxy(createMockRequest('/login?from=https://evil.com', 'jwt-token'));
        expect(res.status).toBe(307);
        expect(new URL(res.headers.get('location')!).pathname).toBe('/');
    });

    // ─── /verify-email — доступна всем ──────────────────────────

    it('пропускает гостя на /verify-email', () => {
        const res = proxy(createMockRequest('/verify-email?token=abc'));
        expect(res.headers.get('x-middleware-next')).toBe('1');
    });

    it('пропускает залогиненного на /verify-email', () => {
        const res = proxy(createMockRequest('/verify-email?token=abc', 'jwt-token'));
        expect(res.headers.get('x-middleware-next')).toBe('1');
    });

    // ─── Приватные страницы ──────────────────────────────────────

    it('редиректит гостя с /profile на /login', () => {
        const res = proxy(createMockRequest('/profile'));
        expect(res.status).toBe(307);
        const location = new URL(res.headers.get('location')!);
        expect(location.pathname).toBe('/login');
        expect(location.searchParams.get('from')).toBe('/profile');
    });

    it('редиректит гостя с /orders на /login', () => {
        const res = proxy(createMockRequest('/orders'));
        expect(res.status).toBe(307);
        expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
    });

    it('редиректит гостя с /checkout на /login', () => {
        const res = proxy(createMockRequest('/checkout'));
        expect(res.status).toBe(307);
        expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
    });

    it('редиректит гостя с вложенного /profile/change-email на /login', () => {
        const res = proxy(createMockRequest('/profile/change-email'));
        expect(res.status).toBe(307);
        const location = new URL(res.headers.get('location')!);
        expect(location.pathname).toBe('/login');
        expect(location.searchParams.get('from')).toBe('/profile/change-email');
    });

    it('пропускает залогиненного на /profile', () => {
        const res = proxy(createMockRequest('/profile', 'jwt-token'));
        expect(res.headers.get('x-middleware-next')).toBe('1');
    });

    it('пропускает залогиненного на /orders', () => {
        const res = proxy(createMockRequest('/orders', 'jwt-token'));
        expect(res.headers.get('x-middleware-next')).toBe('1');
    });

    it('редиректит гостя с /real-estate на /login', () => {
        const res = proxy(createMockRequest('/real-estate'));
        expect(res.status).toBe(307);
        const location = new URL(res.headers.get('location')!);
        expect(location.pathname).toBe('/login');
        expect(location.searchParams.get('from')).toBe('/real-estate');
    });

    it('редиректит гостя с /real-estate/add на /login', () => {
        const res = proxy(createMockRequest('/real-estate/add'));
        expect(res.status).toBe(307);
        expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
    });

    it('пропускает залогиненного на /real-estate', () => {
        const res = proxy(createMockRequest('/real-estate', 'jwt-token'));
        expect(res.headers.get('x-middleware-next')).toBe('1');
    });
});
