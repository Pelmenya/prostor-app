import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import type { TGroup, TGroupPath } from '../model/types/t-group';
import type { TProduct } from '../model/types/t-product';

const BASE = '/moysklad';

/**
 * Верхнеуровневые группы каталога
 */
export function useTopLevelGroups() {
    return useQuery({
        queryKey: ['catalog', 'top-level-groups'],
        queryFn: () => apiClient<TGroup[]>(`${BASE}/top-level-groups`),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Подгруппы по ID группы
 */
export function useSubGroups(groupId: string) {
    return useQuery({
        queryKey: ['catalog', 'groups', groupId],
        queryFn: () => apiClient<TGroup[]>(`${BASE}/group/${groupId}/groups`),
        enabled: !!groupId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Товары по ID группы
 */
export function useProducts(groupId: string) {
    return useQuery({
        queryKey: ['catalog', 'products', groupId],
        queryFn: () => apiClient<TProduct[]>(`${BASE}/group/${groupId}/products`),
        enabled: !!groupId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Товар по ID
 */
export function useProduct(productId: string) {
    return useQuery({
        queryKey: ['catalog', 'product', productId],
        queryFn: () => apiClient<TProduct>(`${BASE}/product/${productId}`),
        enabled: !!productId,
    });
}

/**
 * Путь группы (для хлебных крошек)
 */
export function useGroupPath(groupId: string) {
    return useQuery({
        queryKey: ['catalog', 'group-path', groupId],
        queryFn: () => apiClient<TGroupPath[]>(`${BASE}/group/${groupId}/path`),
        enabled: !!groupId,
        staleTime: 5 * 60 * 1000,
    });
}
