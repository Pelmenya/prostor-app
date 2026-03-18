export type TPlatform = 'telegram' | 'max' | 'web';

export type TMessengerUser = {
    id: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    photo?: string;
};

export type TMessengerAdapter = {
    platform: TPlatform;
    isReady: boolean;
    init(): Promise<void>;
    getAuthHeader(): string | null;
    getUser(): TMessengerUser | null;
    isAuthenticated(): boolean;
    close?(): void;
    openLink?(url: string): void;
};
