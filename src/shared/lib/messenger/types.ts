export type TPlatform = 'telegram' | 'max' | 'web';

export type TMessengerUser = {
    id: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    photo?: string;
};

export type THapticType = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';

export type TMessengerAdapter = {
    platform: TPlatform;
    isReady: boolean;

    // Lifecycle
    init(): Promise<void>;
    close?(): void;

    // Auth
    getAuthHeader(): string | null;
    getUser(): TMessengerUser | null;
    isAuthenticated(): boolean;

    // Navigation
    openLink?(url: string): void;
    showBackButton?(onClick: () => void): () => void;
    getStartParam?(): string | undefined;

    // Платежи
    openInvoice?(url: string): Promise<string>;

    // Haptic
    haptic?(type?: THapticType): void;
    hapticSelection?(): void;

    // Тема
    getIsDark?(): boolean;
};
