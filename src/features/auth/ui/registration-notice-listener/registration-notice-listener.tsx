'use client';

import { useState } from 'react';
import { useIsClient } from '@/shared/lib';

const FLAG_KEY = 'reg-notice-pending';

/**
 * Читает sessionStorage-флаг, выставленный register-page.tsx перед
 * router.push (REG-03). Показывает alert-info один раз на первой странице
 * после регистрации — независимо от того, куда пришёл редирект
 * (getSafeRedirect по умолчанию ведёт на '/', не на /profile).
 * Подключается в (web)/layout.tsx рядом с SessionExpiredListener.
 *
 * `useIsClient` (useSyncExternalStore) — тот же SSR-safe паттерн, что и в
 * PushPromoBanner: сервер и первый клиентский рендер отдают null, флаг
 * читается только после монтирования (без cascading setState в useEffect,
 * react-hooks/set-state-in-effect).
 */
export function RegistrationNoticeListener() {
    const mounted = useIsClient();
    const [dismissed, setDismissed] = useState(false);

    if (!mounted || dismissed) return null;

    const visible = sessionStorage.getItem(FLAG_KEY) === '1';

    if (!visible) return null;

    function dismiss() {
        sessionStorage.removeItem(FLAG_KEY);
        setDismissed(true);
    }

    return (
        <div className="alert alert-info text-sm flex items-center justify-between">
            <span>Мы отправили письмо для подтверждения почты</span>
            <button onClick={dismiss} aria-label="Закрыть" className="btn btn-ghost btn-xs">
                ×
            </button>
        </div>
    );
}
