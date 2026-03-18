import type { TPlatform } from '../types';
import { useMessenger } from './use-messenger';

export function useAuth() {
    const adapter = useMessenger();

    return {
        authHeader: adapter?.getAuthHeader() ?? null,
        user: adapter?.getUser() ?? null,
        isAuthenticated: adapter?.isAuthenticated() ?? false,
        platform: (adapter?.platform ?? 'web') as TPlatform,
    };
}
