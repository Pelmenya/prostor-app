import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import type { TGroup, TGroupPath } from '../model/types/t-group';
import type { TProduct, TImage } from '../model/types/t-product';

const BASE = '/moysklad';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

/**
 * Изображения товара
 */
export function useProductImages(productId: string) {
    return useQuery({
        queryKey: ['catalog', 'product-images', productId],
        queryFn: () => apiClient<TImage[]>(`${BASE}/product/${productId}/images`),
        enabled: !!productId,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Изображения bundle (для групп каталога)
 */
export function useBundleImages(bundleId: string | undefined) {
    return useQuery({
        queryKey: ['catalog', 'bundle-images', bundleId],
        queryFn: () => apiClient<TImage[]>(`${BASE}/bundle/${bundleId}/images`),
        enabled: !!bundleId,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * URL для прокси-загрузки изображения через бэкенд
 * МойСклад требует авторизацию — грузим через наш бэк
 */
export function getImageProxyUrl(downloadHref: string): string {
    return `${API_URL}${BASE}/image?href=${encodeURIComponent(downloadHref)}`;
}
