import type { TPlatform } from '../types';
import { usePlatform } from './use-platform';
import { useAuthStore } from '@/shared/lib/auth';

export function useAuth() {
    const adapter = usePlatform();
    const { accessToken, user: storeUser, isAuthenticated: storeAuth } = useAuthStore();

    // Miniapp — адаптер есть
    if (adapter) {
        return {
            authHeader: adapter.getAuthHeader(),
            user: adapter.getUser(),
            isAuthenticated: adapter.isAuthenticated(),
            platform: adapter.platform as TPlatform,
        };
    }

    // Web — JWT из auth store
    return {
        authHeader: accessToken ? `Bearer ${accessToken}` : null,
        user: storeUser
            ? {
                  id: storeUser.id,
                  firstName: storeUser.first_name,
                  lastName: storeUser.last_name,
                  username: storeUser.username,
                  photo: storeUser.photo_url,
              }
            : null,
        isAuthenticated: storeAuth,
        platform: 'web' as TPlatform,
    };
}
