import type { TPlatformAdapter, TPlatformUser, TPlatform } from '../types';

export class WebAdapter implements TPlatformAdapter {
    platform: TPlatform = 'web';
    isReady = false;

    async init(): Promise<void> {
        this.isReady = true;
    }

    getAuthHeader(): string | null {
        return null;
    }

    getUser(): TPlatformUser | null {
        return null;
    }

    isAuthenticated(): boolean {
        return false;
    }

    openLink(url: string): void {
        window.open(url, '_blank');
    }
}
