import { describe, it, expect, vi } from 'vitest';

vi.mock('@tma.js/sdk-react', () => ({
    init: vi.fn(),
    miniApp: {
        mount: vi.fn(),
        ready: vi.fn(),
        close: vi.fn(),
        isDark: vi.fn(),
        bindCssVars: vi.fn(),
    },
    backButton: { mount: vi.fn() },
    viewport: { isMounted: vi.fn(), mount: vi.fn(), expand: vi.fn(), bindCssVars: vi.fn() },
    themeParams: { mount: vi.fn(), bindCssVars: vi.fn() },
    swipeBehavior: { mount: vi.fn(), disableVertical: vi.fn() },
    initData: { restore: vi.fn(), raw: vi.fn(), user: vi.fn(), startParam: vi.fn() },
    openLink: vi.fn(),
    hapticFeedback: { impactOccurred: vi.fn(), selectionChanged: vi.fn() },
    invoice: { isSupported: vi.fn(), openUrl: vi.fn() },
}));

import { createPlatformAdapter } from './factory';
import { TelegramAdapter } from './adapters/telegram-adapter';
import { WebAdapter } from './adapters/web-adapter';
import { MaxAdapter } from './adapters/max-adapter';

describe('createPlatformAdapter', () => {
    it('telegram → TelegramAdapter', () => {
        expect(createPlatformAdapter('telegram')).toBeInstanceOf(TelegramAdapter);
    });

    it('web → WebAdapter', () => {
        expect(createPlatformAdapter('web')).toBeInstanceOf(WebAdapter);
    });

    it('max → MaxAdapter', () => {
        expect(createPlatformAdapter('max')).toBeInstanceOf(MaxAdapter);
    });
});
