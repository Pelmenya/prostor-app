'use client';

import { useState } from 'react';
import { useIsClient } from '@/shared/lib';
import { REGISTRATION_NOTICE_FLAG_KEY as FLAG_KEY } from '../../lib/registration-notice';

/**
 * Читает флаг из sessionStorage. Обёрнуто в try/catch — доступ к storage
 * может синхронно бросить исключение (заблокированное хранилище в
 * embedded webview, приватный режим Safari с определёнными настройками
 * ITP, sandboxed iframe), а компонент смонтирован без error boundary
 * на каждой странице (web)-layout.
 */
function readFlag(): boolean {
    try {
        return sessionStorage.getItem(FLAG_KEY) === '1';
    } catch {
        return false;
    }
}

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

    const visible = readFlag();

    if (!visible) return null;

    function dismiss() {
        try {
            sessionStorage.removeItem(FLAG_KEY);
        } catch {
            // тихо игнорируем — недоступность storage не должна ронять layout
        }
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
