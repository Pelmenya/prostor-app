'use client';

import { useState } from 'react';
import { telegramNonce } from '../api/auth-api';

export type TTelegramOidcState =
    | 'idle'
    | 'nonce-loading'
    | 'awaiting-popup'
    | 'exchanging'
    | 'error';

export type TTelegramOidcError = 'popup-blocked' | 'cancelled' | 'unknown';

export type TTelegramOidcResult = { idToken: string } | { error: TTelegramOidcError };

// window.Telegram.Login глобальный тип объявлен в
// shared/lib/platform/utils/detect-platform.ts (общий namespace window.Telegram
// с Mini App SDK's WebApp) — не дублировать declare global здесь, TS требует
// идентичного типа при повторном объявлении одного и того же свойства.

function mapTelegramError(raw: string | undefined): TTelegramOidcError {
    if (!raw) return 'unknown';
    const normalized = raw.toLowerCase();
    if (normalized.includes('popup') || normalized.includes('block')) return 'popup-blocked';
    if (
        normalized.includes('cancel') ||
        normalized.includes('declin') ||
        normalized.includes('closed')
    ) {
        return 'cancelled';
    }
    return 'unknown';
}

/**
 * Переиспользуемый низкоуровневый транспорт "клик → nonce → popup →
 * id_token" (RESEARCH Pattern 1). Не знает и не должен знать, что вызывающий
 * будет делать с id_token дальше (login/register/link — Phase 4 LINK-01
 * переиспользует без изменений). id_token остаётся непрозрачным
 * bearer-значением — никогда не декодируется и не проверяется на клиенте
 * (T-03-03), верифицирует его исключительно backend.
 *
 * ВАЖНО: Cross-Origin-Opener-Policy: same-origin на /login и
 * /telegram-register НИКОГДА не должен выставляться — это разорвёт
 * window.opener-связь, на которой держится callback этого виджета
 * (T-03-06). next.config.ts сегодня headers() не задаёт — не менять это
 * бездумно в будущей security-hardening фазе.
 */
export function useTelegramOidc(clientId: number) {
    const [state, setState] = useState<TTelegramOidcState>('idle');

    async function getIdToken(): Promise<TTelegramOidcResult> {
        setState('nonce-loading');

        let nonce: string;
        try {
            ({ nonce } = await telegramNonce());
        } catch {
            setState('error');
            return { error: 'unknown' };
        }

        if (!window.Telegram?.Login) {
            setState('error');
            return { error: 'unknown' };
        }

        setState('awaiting-popup');

        return new Promise<TTelegramOidcResult>((resolve) => {
            try {
                window.Telegram!.Login!.auth(
                    { client_id: clientId, nonce, scope: ['profile'] },
                    (data) => {
                        if (data.id_token) {
                            setState('exchanging');
                            resolve({ idToken: data.id_token });
                            return;
                        }
                        setState('error');
                        resolve({ error: mapTelegramError(data.error) });
                    },
                );
            } catch {
                // window.open() синхронно заблокирован браузером — самый
                // частый реальный сигнал заблокированного OIDC-попапа
                // (Pitfall 1: click → await nonce съедает user-activation).
                setState('error');
                resolve({ error: 'popup-blocked' });
            }
        });
    }

    return { state, getIdToken };
}
