import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { vi } from 'vitest';
import {
    TELEGRAM_REG_TOKEN_KEY,
    TELEGRAM_REG_PROFILE_KEY,
    TELEGRAM_REG_ISSUED_AT_KEY,
    setTelegramRegistration,
    readTelegramRegistration,
    clearTelegramRegistration,
} from './telegram-registration';

const PROFILE = { first_name: 'Пётр', last_name: 'Ермалюк' };

describe('telegram-registration', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('setTelegramRegistration → readTelegramRegistration делают round-trip token + profile', () => {
        setTelegramRegistration('reg-token-123', PROFILE);

        expect(readTelegramRegistration()).toEqual({
            token: 'reg-token-123',
            profile: PROFILE,
        });
    });

    it('возвращает null, если issued-at старше 10 минут', () => {
        const dateSpy = vi.spyOn(Date, 'now');
        dateSpy.mockReturnValue(1_000_000);
        setTelegramRegistration('reg-token-123', PROFILE);

        dateSpy.mockReturnValue(1_000_000 + 10 * 60 * 1000 + 1);
        expect(readTelegramRegistration()).toBeNull();
    });

    it('возвращает null, если отсутствует любой из ключей', () => {
        sessionStorage.setItem(TELEGRAM_REG_TOKEN_KEY, 'tok');
        sessionStorage.setItem(TELEGRAM_REG_PROFILE_KEY, JSON.stringify(PROFILE));
        // TELEGRAM_REG_ISSUED_AT_KEY отсутствует

        expect(readTelegramRegistration()).toBeNull();
    });

    it('clearTelegramRegistration удаляет все три TELEGRAM_REG_* ключа', () => {
        setTelegramRegistration('reg-token-123', PROFILE);

        clearTelegramRegistration();

        expect(sessionStorage.getItem(TELEGRAM_REG_TOKEN_KEY)).toBeNull();
        expect(sessionStorage.getItem(TELEGRAM_REG_PROFILE_KEY)).toBeNull();
        expect(sessionStorage.getItem(TELEGRAM_REG_ISSUED_AT_KEY)).toBeNull();
    });

    it('fail-closed: readTelegramRegistration возвращает null при синхронном throw sessionStorage', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new DOMException('SecurityError');
        });

        expect(readTelegramRegistration()).toBeNull();
    });

    it('fail-closed: setTelegramRegistration не пробрасывает throw sessionStorage', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('SecurityError');
        });

        expect(() => setTelegramRegistration('reg-token-123', PROFILE)).not.toThrow();
    });
});
