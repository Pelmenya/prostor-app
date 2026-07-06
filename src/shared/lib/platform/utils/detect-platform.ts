import type { TPlatform } from '../types';

declare global {
    interface Window {
        // window.Telegram — общий namespace для ДВУХ разных Telegram-сущностей:
        // WebApp (Mini App SDK, initData, этот файл) и Login (web OIDC-виджет,
        // src/features/auth/lib/use-telegram-oidc.ts, Phase 3). TS требует
        // идентичного типа при повторном объявлении одного и того же
        // глобального свойства в разных файлах — держать эту фигурную скобку
        // синхронизированной с use-telegram-oidc.ts при изменении любой из них.
        Telegram?: {
            WebApp?: Record<string, unknown>;
            Login?: {
                auth(
                    options: {
                        client_id: number;
                        nonce?: string;
                        scope?: string[];
                        lang?: string;
                    },
                    callback: (data: { id_token?: string; user?: unknown; error?: string }) => void,
                ): void;
            };
        };
    }
}

export function detectPlatform(): TPlatform {
    if (typeof window === 'undefined') {
        return 'web';
    }

    if (window.Telegram?.WebApp) {
        return 'telegram';
    }

    // TODO: MAX Mini App detection
    // if (window.Max?.MiniApp) {
    //     return 'max';
    // }

    return 'web';
}
