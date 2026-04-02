'use client';

import { useQueries } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import type { TImage } from '@/shared/model';
import { getImageProxyUrl } from './product.api';

const BASE = '/moysklad';

export function useProductThumbnails(productIds: string[]) {
    const queries = useQueries({
        queries: productIds.map((id) => ({
            queryKey: ['catalog', 'product-images', id],
            queryFn: () => apiClient<TImage[]>(`${BASE}/product/${id}/images`),
            staleTime: 10 * 60 * 1000,
        })),
    });

    const imageUrls: Record<string, string | undefined> = {};
    const loadingIds = new Set<string>();

    productIds.forEach((id, idx) => {
        const query = queries[idx];
        if (query.isLoading) {
            loadingIds.add(id);
        }
        const mainImage = query.data?.[0];
        if (mainImage) {
            imageUrls[id] = getImageProxyUrl(mainImage.meta.downloadHref);
        }
    });

    return { imageUrls, loadingIds };
}
