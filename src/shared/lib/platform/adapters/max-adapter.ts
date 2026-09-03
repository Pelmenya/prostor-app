import type { TPlatformAdapter, TPlatformUser, TPlatform } from '../types';

// TODO: импорт MAX SDK когда появится

export class MaxAdapter implements TPlatformAdapter {
    platform: TPlatform = 'max';
    isReady = false;

    async init(): Promise<void> {
        // TODO: MAX SDK init (аналогичен Telegram)
        this.isReady = true;
    }

    getAuthHeader(): string | null {
        // TODO: return `max ${initData}`;
        return null;
    }

    getUser(): TPlatformUser | null {
        // TODO: парсинг initData.user (формат аналогичен Telegram)
        return null;
    }

    isAuthenticated(): boolean {
        // TODO: проверка наличия initData
        return false;
    }

    close(): void {
        // TODO: MAX Mini App close
    }

    openLink(url: string): void {
        // TODO: MAX openLink
        window.open(url, '_blank');
    }
}
