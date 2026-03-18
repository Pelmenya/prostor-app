import type { TMessengerAdapter, TMessengerUser, TPlatform } from '../types';
import { init as initSDK, retrieveLaunchParams, postEvent } from '@telegram-apps/sdk-react';

type TLaunchParamsUser = {
    id: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
};

export class TelegramAdapter implements TMessengerAdapter {
    platform: TPlatform = 'telegram';
    isReady = false;
    private initDataRaw: string | null = null;
    private user: TMessengerUser | null = null;

    async init(): Promise<void> {
        try {
            initSDK();

            const launchParams = retrieveLaunchParams();
            this.initDataRaw = String(launchParams.initDataRaw ?? '') || null;

            const initData = launchParams.initData as { user?: TLaunchParamsUser } | undefined;

            if (initData?.user) {
                const u = initData.user;
                this.user = {
                    id: u.id,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    username: u.username,
                    photo: u.photoUrl,
                };
            }

            postEvent('web_app_ready');
            this.isReady = true;
        } catch (error) {
            console.error('[TelegramAdapter] init failed:', error);
            throw error;
        }
    }

    getAuthHeader(): string | null {
        if (!this.initDataRaw) return null;
        return `tma ${this.initDataRaw}`;
    }

    getUser(): TMessengerUser | null {
        return this.user;
    }

    isAuthenticated(): boolean {
        return !!this.initDataRaw;
    }

    close(): void {
        postEvent('web_app_close');
    }

    openLink(url: string): void {
        postEvent('web_app_open_link', { url });
    }
}
