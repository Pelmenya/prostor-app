import type { TPlatform } from '../types';
import { usePlatform } from './use-platform';

// TODO: когда появится NextAuth — добавить fallback на сессию для (web) layout.
// Сейчас без PlatformProvider authHeader = null → запросы без авторизации.
// Web-авторизация: useAuth() должен проверять NextAuth session если adapter === null.
export function useAuth() {
    const adapter = usePlatform();

    return {
        authHeader: adapter?.getAuthHeader() ?? null,
        user: adapter?.getUser() ?? null,
        isAuthenticated: adapter?.isAuthenticated() ?? false,
        platform: (adapter?.platform ?? 'web') as TPlatform,
    };
}
