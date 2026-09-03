const CATALOG_ROUTES = ['/', '/catalog', '/product'] as const;

export function isCatalogRoute(pathname: string): boolean {
    return CATALOG_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
