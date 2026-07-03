'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { PRIVATE_PATHS } from '@/shared/config';
import { getSafeRedirect } from '@/shared/lib';

/**
 * Слушает window-событие auth:session-expired (диспатчится из api-client.ts
 * при терминальном провале refresh, SESSION-04) и форсирует редирект на
 * /login с приватных страниц. Подключается в (web)/layout.tsx рядом с
 * CartSyncProvider. Рендерит null — только логика.
 */
export function SessionExpiredListener() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        function handleSessionExpired(): void {
            if (pathname === '/login') return; // защита от цикла редиректов

            const isPrivate = PRIVATE_PATHS.some(
                (p) => pathname === p || pathname.startsWith(`${p}/`),
            );
            if (!isPrivate) return;

            router.push(`/login?from=${encodeURIComponent(getSafeRedirect(pathname))}`);
        }

        window.addEventListener('auth:session-expired', handleSessionExpired);
        return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
    }, [pathname, router]);

    return null;
}
