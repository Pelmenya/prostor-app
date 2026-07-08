export const PRIVATE_PATHS = ['/profile', '/orders', '/checkout', '/real-estate'];

/**
 * Проверяет, относится ли путь к приватной секции приложения (требует
 * редиректа на /login при истечении сессии или редиректа после logout).
 * Единая реализация — не дублировать в use-logout.ts / session-expired-listener.tsx (WR-04).
 */
export function isPrivatePath(pathname: string): boolean {
    return PRIVATE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
