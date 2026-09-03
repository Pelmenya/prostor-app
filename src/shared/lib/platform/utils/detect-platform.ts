import type { TPlatform } from '../types';

declare global {
    interface Window {
        Telegram?: {
            WebApp?: Record<string, unknown>;
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
