import type { TPlatform } from '../types';
import { usePlatform } from './use-platform';
import { useAuthStore } from '@/shared/lib/auth';

export function useAuth() {
    const adapter = usePlatform();
    const store = useAuthStore();

    return {
        authHeader:
            adapter?.getAuthHeader() ?? (store.accessToken ? `Bearer ${store.accessToken}` : null),
        user: adapter?.getUser() ?? null,
        isAuthenticated: adapter?.isAuthenticated() ?? store.isAuthenticated,
        platform: (adapter?.platform ?? 'web') as TPlatform,
        logout: store.logout,
    };
}
