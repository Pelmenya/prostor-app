import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
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
    productSearchPaginated: (q: string, hasMaintenance: boolean) =>
        ['catalog', 'product-search-paginated', q, hasMaintenance] as const,
    productSearchCount: (q: string, hasMaintenance: boolean) =>
        ['catalog', 'product-search-count', q, hasMaintenance] as const,
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

export const fetchProductImages = (productId: string) =>
    apiClient<TImage[]>(`${BASE}/product/${productId}/images`);

export const fetchBundleImages = (bundleId: string) =>
    apiClient<TImage[]>(`${BASE}/bundle/${bundleId}/images`);

/**
 * Верхнеуровневые группы каталога
 */
export function useTopLevelGroups() {
    return useQuery({
        queryKey: productKeys.topLevelGroups(),
        queryFn: fetchTopLevelGroups,
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
        queryFn: () => fetchProductImages(productId),
        enabled: !!productId,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Поиск товаров по строке.
 * options.hasMaintenance — фильтр на бэке: только товары с компонентами для обслуживания.
 */
export function useProductSearch(query: string, options?: { hasMaintenance?: boolean }) {
    const hasMaintenance = options?.hasMaintenance ?? false;
    return useQuery({
        queryKey: ['catalog', 'product-search', query, hasMaintenance] as const,
        queryFn: () => {
            const params = new URLSearchParams({ q: query });
            if (hasMaintenance) params.set('hasMaintenance', 'true');
            return apiClient<TProduct[]>(`${BASE}/product/search?${params}`);
        },
        enabled: query.length >= 2,
        staleTime: 30 * 1000,
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
            return fetchBundleImages(bundleId);
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

export type TPaginatedProducts = {
    items: TProduct[];
    nextCursor: string | undefined;
    hasMore: boolean;
};

/**
 * Поиск товаров с cursor-based пагинацией (для модального окна поиска)
 */
export function useProductSearchPaginated(
    q: string,
    options?: { hasMaintenance?: boolean; limit?: number },
) {
    const hasMaintenance = options?.hasMaintenance ?? false;
    const limit = options?.limit ?? 20;
    return useInfiniteQuery({
        queryKey: productKeys.productSearchPaginated(q, hasMaintenance),
        queryFn: ({ pageParam }: { pageParam: string | undefined }) => {
            const params = new URLSearchParams({ q, limit: String(limit) });
            if (pageParam) params.set('cursor', pageParam);
            if (hasMaintenance) params.set('hasMaintenance', 'true');
            return apiClient<TPaginatedProducts>(`${BASE}/product/search/paginated?${params}`);
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
        enabled: q.length >= 2,
        staleTime: 30 * 1000,
    });
}

/**
 * Количество товаров по поисковому запросу
 */
export function useProductSearchCount(q: string, options?: { hasMaintenance?: boolean }) {
    const hasMaintenance = options?.hasMaintenance ?? false;
    return useQuery({
        queryKey: productKeys.productSearchCount(q, hasMaintenance),
        queryFn: () => {
            const params = new URLSearchParams({ q: encodeURIComponent(q) });
            if (hasMaintenance) params.set('hasMaintenance', 'true');
            return apiClient<{ count: number }>(`${BASE}/product/search/count?${params}`);
        },
        enabled: q.length >= 2,
        staleTime: 30 * 1000,
    });
}
