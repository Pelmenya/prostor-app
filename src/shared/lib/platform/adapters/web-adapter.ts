import type { TPlatformAdapter, TPlatformUser, TPlatform } from '../types';
import { useAuthStore, mapUserToPlatformUser } from '@/shared/lib';

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
        return mapUserToPlatformUser(user);
    }

    isAuthenticated(): boolean {
        return useAuthStore.getState().isAuthenticated;
    }

    openLink(url: string): void {
        window.open(url, '_blank');
    }
}
