import { describe, it, expect, vi, afterEach } from 'vitest';
import { detectPlatform } from './detect-platform';

describe('detectPlatform', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('возвращает "web" на сервере (без window)', () => {
        vi.stubGlobal('window', undefined);
        expect(detectPlatform()).toBe('web');
    });

    it('возвращает "telegram" если есть window.Telegram.WebApp', () => {
        vi.stubGlobal('window', {
            Telegram: { WebApp: {} },
        });
        expect(detectPlatform()).toBe('telegram');
    });

    it('возвращает "web" если window.Telegram отсутствует', () => {
        vi.stubGlobal('window', {});
        expect(detectPlatform()).toBe('web');
    });

    it('возвращает "web" если window.Telegram есть но WebApp нет', () => {
        vi.stubGlobal('window', {
            Telegram: {},
        });
        expect(detectPlatform()).toBe('web');
    });
});
