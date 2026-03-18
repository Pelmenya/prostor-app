import type { TPlatform } from '../types';
import { useMessenger } from './use-messenger';

// TODO: когда появится NextAuth — добавить fallback на сессию для (web) layout.
// Сейчас без MessengerProvider authHeader = null → запросы без авторизации.
// Web-авторизация: useAuth() должен проверять NextAuth session если adapter === null.
export function useAuth() {
    const adapter = useMessenger();

    return {
        authHeader: adapter?.getAuthHeader() ?? null,
        user: adapter?.getUser() ?? null,
        isAuthenticated: adapter?.isAuthenticated() ?? false,
        platform: (adapter?.platform ?? 'web') as TPlatform,
    };
}
