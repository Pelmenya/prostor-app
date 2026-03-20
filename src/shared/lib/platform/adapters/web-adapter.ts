import type { TPlatformAdapter, TPlatformUser, TPlatform } from '../types';
import { useAuthStore } from '@/shared/lib/auth';

export class WebAdapter implements TPlatformAdapter {
    platform: TPlatform = 'web';
    isReady = false;

    async init(): Promise<void> {
        this.isReady = true;
    }

    getAuthHeader(): string | null {
        const { accessToken } = useAuthStore.getState();
        return accessToken ? `Bearer ${accessToken}` : null;
    }

    getUser(): TPlatformUser | null {
        const { user } = useAuthStore.getState();
        if (!user) return null;
        return {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            username: user.username,
            photo: user.photo_url,
        };
    }

    isAuthenticated(): boolean {
        return useAuthStore.getState().isAuthenticated;
    }

    openLink(url: string): void {
        window.open(url, '_blank');
    }
}
