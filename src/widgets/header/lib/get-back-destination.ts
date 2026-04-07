/**
 * Возвращает URL для кнопки "Назад" в хедере, либо null если страница верхнего уровня.
 */

/** Страницы верхнего уровня — стрелку не показываем */
const TOP_LEVEL_PATHS = new Set([
    '/',
    '/catalog',
    '/orders',
    '/cart',
    '/profile',
    '/real-estate',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
]);

/** Явные переопределения: паттерн → родительский маршрут */
const EXPLICIT_BACK: Array<{
    pattern: RegExp;
    to: string | ((match: RegExpMatchArray) => string);
}> = [
    // /orders/123/chat  → /orders/123  (раньше, чем /orders/123)
    { pattern: /^\/orders\/(\d+)\/.+$/, to: (m) => `/orders/${m[1]}` },
    // /orders/123  → /orders
    { pattern: /^\/orders\/\d+$/, to: '/orders' },
    // /catalog/abc  → /catalog
    { pattern: /^\/catalog\/.+/, to: '/catalog' },
    // /product/abc  → история браузера (пришли из каталога, заказа и т.д.)
    { pattern: /^\/product\/.+/, to: '' },
    // /real-estate/add  → /real-estate (частный случай перед общим)
    { pattern: /^\/real-estate\/add$/, to: '/real-estate' },
    // /real-estate/123  → /real-estate
    { pattern: /^\/real-estate\/.+/, to: '/real-estate' },
    // /profile/*  → /profile
    { pattern: /^\/profile\/.+/, to: '/profile' },
];

export function getBackDestination(pathname: string): string | null {
    if (TOP_LEVEL_PATHS.has(pathname)) return null;

    for (const { pattern, to } of EXPLICIT_BACK) {
        const match = pathname.match(pattern);
        if (match) {
            return typeof to === 'function' ? to(match) : to;
        }
    }

    return null;
}
