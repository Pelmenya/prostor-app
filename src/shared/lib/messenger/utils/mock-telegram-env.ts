import { mockTelegramEnv } from '@tma.js/sdk-react';

const THEME_PARAMS = {
    accent_text_color: '#6ab2f2',
    bg_color: '#ffffff',
    button_color: '#5288c1',
    button_text_color: '#ffffff',
    destructive_text_color: '#ec3942',
    header_bg_color: '#ffffff',
    hint_color: '#708499',
    link_color: '#6ab3f3',
    secondary_bg_color: '#f0f0f0',
    section_bg_color: '#ffffff',
    section_header_text_color: '#6ab3f3',
    subtitle_text_color: '#708499',
    text_color: '#000000',
} as const;

/**
 * Mock Telegram окружения для разработки вне Telegram.
 * Вызывать ПЕРЕД init() SDK.
 */
export function setupMockTelegramEnv(): void {
    if (typeof window === 'undefined') return;

    // Не мокаем если уже в Telegram
    if (window.Telegram?.WebApp) return;

    mockTelegramEnv({
        launchParams: {
            tgWebAppThemeParams: THEME_PARAMS,
            tgWebAppData: new URLSearchParams([
                [
                    'user',
                    JSON.stringify({
                        id: 1,
                        first_name: 'Dev',
                        last_name: 'User',
                        username: 'devuser',
                    }),
                ],
                ['hash', ''],
                ['signature', ''],
                ['auth_date', Math.floor(Date.now() / 1000).toString()],
            ]),
            tgWebAppVersion: '8',
            tgWebAppPlatform: 'tdesktop',
        },
    });
}
