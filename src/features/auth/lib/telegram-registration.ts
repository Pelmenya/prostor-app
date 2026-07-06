/**
 * sessionStorage-цикл жизни Telegram-регистрации (TG-02/TG-03).
 *
 * Единый источник правды для ключей — избегаем рассинхрона строкового
 * литерала между писателем (login-page.tsx, этот план) и читателем
 * (telegram-register-page.tsx, Plan 02), тот же принцип, что
 * REGISTRATION_NOTICE_FLAG_KEY (registration-notice.ts). Каждое обращение
 * к sessionStorage обёрнуто в try/catch и фейлится закрыто — мирроит
 * use-form-draft.ts (storage может синхронно throw в приватном режиме
 * Safari / sandboxed iframe).
 */
export const TELEGRAM_REG_TOKEN_KEY = 'telegram-registration-token';
export const TELEGRAM_REG_PROFILE_KEY = 'telegram-registration-profile';
export const TELEGRAM_REG_ISSUED_AT_KEY = 'telegram-registration-issued-at';

/**
 * Одноразовый флаг для TelegramLinkHintListener (TG-04, будущий план этой
 * фазы) — тот же паттерн, что REGISTRATION_NOTICE_FLAG_KEY.
 */
export const TELEGRAM_LINK_HINT_FLAG_KEY = 'telegram-link-hint-pending';

// 10 минут — зеркалит backend TTL; клиентская проверка нужна только для UX
// (мгновенный TG-03 restart-state без обречённого round-trip), не является
// security-контролем — единственный authoritative TTL/one-time enforcement
// на стороне backend.
const TTL_MS = 10 * 60 * 1000;

export type TTelegramProfile = {
    first_name: string;
    last_name?: string;
    photo_url?: string;
};

export function setTelegramRegistration(token: string, profile: TTelegramProfile): void {
    try {
        sessionStorage.setItem(TELEGRAM_REG_TOKEN_KEY, token);
        sessionStorage.setItem(TELEGRAM_REG_PROFILE_KEY, JSON.stringify(profile));
        sessionStorage.setItem(TELEGRAM_REG_ISSUED_AT_KEY, String(Date.now()));
    } catch {
        // тихо игнорируем — storage недоступен, readTelegramRegistration()
        // ниже корректно вернёт null (fail-closed → TG-03 restart state)
    }
}

export function readTelegramRegistration(): { token: string; profile: TTelegramProfile } | null {
    try {
        const token = sessionStorage.getItem(TELEGRAM_REG_TOKEN_KEY);
        const profileJson = sessionStorage.getItem(TELEGRAM_REG_PROFILE_KEY);
        const issuedAt = Number(sessionStorage.getItem(TELEGRAM_REG_ISSUED_AT_KEY));
        if (!token || !profileJson || !issuedAt) return null;
        if (Date.now() - issuedAt > TTL_MS) return null;
        return { token, profile: JSON.parse(profileJson) as TTelegramProfile };
    } catch {
        return null;
    }
}

export function clearTelegramRegistration(): void {
    try {
        sessionStorage.removeItem(TELEGRAM_REG_TOKEN_KEY);
        sessionStorage.removeItem(TELEGRAM_REG_PROFILE_KEY);
        sessionStorage.removeItem(TELEGRAM_REG_ISSUED_AT_KEY);
    } catch {
        // тихо игнорируем
    }
}
