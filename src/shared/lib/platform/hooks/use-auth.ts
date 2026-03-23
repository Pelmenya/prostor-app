import type { TPlatform } from '../types';
import { usePlatform } from './use-platform';
import { useAuthStore, mapUserToPlatformUser } from '@/shared/lib';

export function useAuth() {
    const adapter = usePlatform();
    const store = useAuthStore();

    const adapterUser = adapter?.getUser() ?? null;
    const storeUser = mapUserToPlatformUser(store.user);

    return {
        authHeader:
            adapter?.getAuthHeader() ?? (store.accessToken ? `Bearer ${store.accessToken}` : null),
        user: adapterUser ?? storeUser,
        isAuthenticated: adapter?.isAuthenticated() ?? store.isAuthenticated,
        platform: (adapter?.platform ?? 'web') as TPlatform,
        logout: store.logout,
    };
}
