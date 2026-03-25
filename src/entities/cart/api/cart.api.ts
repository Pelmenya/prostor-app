import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import { useAuth } from '@/shared/lib/platform';
import type { TBackendCartState } from './cart.types';

export const CART_QUERY_KEY = ['cart'] as const;

/**
 * Получить корзину с бэка (GET /cart).
 * Бэк актуализирует цены из МойСклад и пересчитывает totals.
 * Включается только для залогиненных пользователей.
 */
export function useCart(options?: { enabled?: boolean }) {
    const api = useApi();
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: CART_QUERY_KEY,
        queryFn: () => api<TBackendCartState>('/cart'),
        enabled: (options?.enabled ?? true) && isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Обновить корзину на бэке (POST /cart).
 * Отправляет полный TBackendCartState, бэк перезаписывает.
 * Используется для debounce sync и merge при логине.
 */
export function useUpdateCart() {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (cartState: TBackendCartState) =>
            api<TBackendCartState>('/cart', {
                method: 'POST',
                body: cartState,
            }),
        onSuccess: (data) => {
            queryClient.setQueryData(CART_QUERY_KEY, data);
        },
        onError: (error) => {
            console.error('[cart] sync failed:', error);
        },
    });
}
