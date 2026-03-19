import type { TMessengerAdapter, TMessengerUser, TPlatform } from '../types';
import {
    init,
    miniApp,
    backButton,
    viewport,
    themeParams,
    swipeBehavior,
    initData,
    hapticFeedback,
    invoice,
    openLink as tmaOpenLink,
} from '@tma.js/sdk-react';

export class TelegramAdapter implements TMessengerAdapter {
    platform: TPlatform = 'telegram';
    isReady = false;

    async init(): Promise<void> {
        try {
            // 1. Инициализация SDK
            init();

            // 2. Монтируем компоненты (порядок важен: themeParams перед miniApp)
            themeParams.mount();
            miniApp.mount();
            backButton.mount();

            // Viewport — async, нужен await
            if (!viewport.isMounted()) {
                await viewport.mount();
            }
            viewport.expand();

            // Swipe — отключаем вертикальный свайп (чтоб не закрывало приложение)
            swipeBehavior.mount();
            swipeBehavior.disableVertical();

            // Восстанавливаем initData
            initData.restore();

            // 3. Привязываем CSS-переменные (safe area, тема, viewport)
            miniApp.bindCssVars();
            themeParams.bindCssVars();
            viewport.bindCssVars();

            // 4. Сигнализируем готовность
            miniApp.ready();

            this.isReady = true;
        } catch (error) {
            console.error('[TelegramAdapter] init failed:', error);
            throw error;
        }
    }

    getAuthHeader(): string | null {
        const raw = initData.raw();
        if (!raw) return null;
        return `tma ${raw}`;
    }

    getUser(): TMessengerUser | null {
        const user = initData.user();
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
        return !!initData.raw();
    }

    close(): void {
        miniApp.close();
    }

    openLink(url: string): void {
        tmaOpenLink(url);
    }

    /**
     * Haptic feedback с fallback на Web Vibration API
     */
    haptic(type: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid' = 'soft'): void {
        try {
            hapticFeedback.impactOccurred(type);
        } catch {
            navigator?.vibrate?.(10);
        }
    }

    /**
     * Haptic feedback при выборе элемента
     */
    hapticSelection(): void {
        try {
            hapticFeedback.selectionChanged();
        } catch {
            navigator?.vibrate?.(8);
        }
    }

    /**
     * Нативная оплата через Telegram Payments
     * @returns статус: 'paid' | 'cancelled' | 'failed' | string
     */
    async openInvoice(url: string): Promise<string> {
        if (!invoice.isSupported()) {
            throw new Error('Telegram Payments не поддерживается в этой версии');
        }
        return invoice.openUrl(url);
    }

    /**
     * Показать нативную кнопку «Назад»
     */
    showBackButton(onClick: () => void): () => void {
        backButton.show();
        const off = backButton.onClick(onClick);
        return () => {
            off();
            backButton.hide();
        };
    }

    /**
     * Start param для deep linking (например 'order__123' → '/order/123')
     */
    getStartParam(): string | undefined {
        return initData.startParam();
    }

    /**
     * Тёмная тема (реактивный сигнал — использовать через useSignal в компонентах)
     */
    getIsDark(): boolean {
        return miniApp.isDark();
    }
}
