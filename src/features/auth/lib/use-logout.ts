'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/shared/lib/platform';
import { useAuthStore } from '@/shared/lib';
import { PRIVATE_PATHS } from '@/shared/config';
import { webLogout } from '../api/auth-api';

/**
 * Хук logout с редиректом только с приватных страниц.
 *
 * Принимает опциональный onBeforeLogout callback для подготовительных
 * действий (например flush корзины) ДО инвалидации токена.
 */
export function useLogout() {
    const router = useRouter();
    const pathname = usePathname();
    const { logout } = useAuth();
    const { accessToken, refreshToken } = useAuthStore();

    return async (onBeforeLogout?: () => Promise<unknown> | unknown) => {
        // 1. Подготовительные действия (flush корзины и т.д.)
        if (onBeforeLogout) {
            try {
                await onBeforeLogout();
            } catch {
                // Не блокируем logout
            }
        }

        // 2. Инвалидировать токен на сервере
        if (accessToken && refreshToken) {
            try {
                await webLogout(accessToken, refreshToken);
            } catch {
                // Игнорируем — главное очистить локальное состояние
            }
        }

        // 3. Очистить локально
        logout();

        // 4. Редирект только с приватных страниц
        const isPrivate = PRIVATE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
        if (isPrivate) router.push('/');
    };
}
