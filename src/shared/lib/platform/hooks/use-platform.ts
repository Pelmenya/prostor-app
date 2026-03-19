import { useContext } from 'react';
import { PlatformContext } from '../platform-provider';
import type { TPlatformAdapter } from '../types';

/**
 * Доступ к адаптеру — возвращает null если вне PlatformProvider.
 * Используется в useAuth() для поддержки (web) layout без PlatformProvider.
 */
export function usePlatform(): TPlatformAdapter | null {
    return useContext(PlatformContext);
}

/**
 * Строгая версия — бросает ошибку вне PlatformProvider.
 * Используется в (miniapp) layout где адаптер обязателен.
 */
export function usePlatformStrict(): TPlatformAdapter {
    const adapter = useContext(PlatformContext);
    if (!adapter) {
        throw new Error('usePlatformStrict вызван вне PlatformProvider');
    }
    return adapter;
}
