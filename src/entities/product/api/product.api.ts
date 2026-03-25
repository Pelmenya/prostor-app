import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { API_URL } from '@/shared/config';
import type { TGroup, TGroupPath, TProduct, TImage } from '@/shared/model';

const BASE = '/moysklad';

// Query keys — единый источник правды для хуков и серверного prefetchQuery.
// Ключи должны совпадать, иначе HydrationBoundary не гидрирует кеш.
export const productKeys = {
    subGroups: (groupId: string) => ['catalog', 'groups', groupId] as const,
    products: (groupId: string) => ['catalog', 'products', groupId] as const,
    groupPath: (groupId: string) => ['catalog', 'group-path', groupId] as const,
    product: (productId: string) => ['catalog', 'product', productId] as const,
    topLevelGroups: () => ['catalog', 'top-level-groups'] as const,
    productImages: (productId: string) => ['catalog', 'product-images', productId] as const,
    bundleImages: (bundleId: string) => ['catalog', 'bundle-images', bundleId] as const,
};

// Серверные fetch-функции (plain async, без хуков) — для prefetchQuery в RSC.
export const fetchTopLevelGroups = () => apiClient<TGroup[]>(`${BASE}/top-level-groups`);

export const fetchSubGroups = (groupId: string) =>
    apiClient<TGroup[]>(`${BASE}/group/${groupId}/groups`);

export const fetchProducts = (groupId: string) =>
    apiClient<TProduct[]>(`${BASE}/group/${groupId}/products`);

export const fetchGroupPath = (groupId: string) =>
    apiClient<TGroupPath[]>(`${BASE}/group/${groupId}/path`);

export const fetchProduct = (productId: string) =>
    apiClient<TProduct>(`${BASE}/product/${productId}`);

/**
 * Верхнеуровневые группы каталога
 */
export function useTopLevelGroups() {
    return useQuery({
        queryKey: productKeys.topLevelGroups(),
        queryFn: () => apiClient<TGroup[]>(`${BASE}/top-level-groups`),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Подгруппы по ID группы
 */
export function useSubGroups(groupId: string) {
    return useQuery({
        queryKey: productKeys.subGroups(groupId),
        queryFn: () => fetchSubGroups(groupId),
        enabled: !!groupId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Товары по ID группы
 */
export function useProducts(groupId: string) {
    return useQuery({
        queryKey: productKeys.products(groupId),
        queryFn: () => fetchProducts(groupId),
        enabled: !!groupId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Товар по ID
 */
export function useProduct(productId: string) {
    return useQuery({
        queryKey: productKeys.product(productId),
        queryFn: () => fetchProduct(productId),
        enabled: !!productId,
    });
}

/**
 * Путь группы (для хлебных крошек)
 */
export function useGroupPath(groupId: string) {
    return useQuery({
        queryKey: productKeys.groupPath(groupId),
        queryFn: () => fetchGroupPath(groupId),
        enabled: !!groupId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Изображения товара
 */
export function useProductImages(productId: string) {
    return useQuery({
        queryKey: productKeys.productImages(productId),
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
        queryKey: productKeys.bundleImages(bundleId ?? ''),
        queryFn: () => {
            if (!bundleId) throw new Error('bundleId is required');
            return apiClient<TImage[]>(`${BASE}/bundle/${bundleId}/images`);
        },
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
