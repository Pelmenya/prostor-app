import type { TMessengerAdapter, TMessengerUser, TPlatform } from '../types';

export class WebAdapter implements TMessengerAdapter {
    platform: TPlatform = 'web';
    isReady = false;
    private devToken: string | null = null;

    async init(): Promise<void> {
        // DEV: токен из env для разработки без авторизации
        if (process.env.NEXT_PUBLIC_DEV_TOKEN) {
            this.devToken = process.env.NEXT_PUBLIC_DEV_TOKEN;
        }

        // TODO: NextAuth — инициализация сессии
        this.isReady = true;
    }

    getAuthHeader(): string | null {
        if (this.devToken) {
            return `Bearer ${this.devToken}`;
        }
        // TODO: NextAuth JWT из сессии
        return null;
    }

    getUser(): TMessengerUser | null {
        // TODO: NextAuth — данные пользователя из сессии
        return null;
    }

    isAuthenticated(): boolean {
        return !!this.devToken;
        // TODO: NextAuth — проверка сессии
    }

    openLink(url: string): void {
        window.open(url, '_blank');
    }
}
