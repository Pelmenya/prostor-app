import { useContext } from 'react';
import { MessengerContext } from '../messenger-provider';
import type { TMessengerAdapter } from '../types';

/**
 * Доступ к адаптеру — возвращает null если вне MessengerProvider.
 * Используется в useAuth() для поддержки (web) layout без MessengerProvider.
 */
export function useMessenger(): TMessengerAdapter | null {
    return useContext(MessengerContext);
}

/**
 * Строгая версия — бросает ошибку вне MessengerProvider.
 * Используется в (miniapp) layout где адаптер обязателен.
 */
export function useMessengerStrict(): TMessengerAdapter {
    const adapter = useContext(MessengerContext);
    if (!adapter) {
        throw new Error('useMessengerStrict вызван вне MessengerProvider');
    }
    return adapter;
}
