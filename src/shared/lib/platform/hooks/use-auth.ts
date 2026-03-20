import type { TPlatform, TPlatformUser } from '../types';
import { usePlatform } from './use-platform';
import { useAuthStore } from '@/shared/lib/auth';

function storeUserToPlatformUser(
    user: {
        id: number;
        first_name: string;
        last_name: string;
        username?: string;
        photo_url?: string;
    } | null,
): TPlatformUser | null {
    if (!user) return null;
    return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        photo: user.photo_url,
    };
}

export function useAuth() {
    const adapter = usePlatform();
    const store = useAuthStore();

    const adapterUser = adapter?.getUser() ?? null;
    const storeUser = storeUserToPlatformUser(store.user);

    return {
        authHeader:
            adapter?.getAuthHeader() ?? (store.accessToken ? `Bearer ${store.accessToken}` : null),
        user: adapterUser ?? storeUser,
        isAuthenticated: adapter?.isAuthenticated() ?? store.isAuthenticated,
        platform: (adapter?.platform ?? 'web') as TPlatform,
        logout: store.logout,
    };
}
