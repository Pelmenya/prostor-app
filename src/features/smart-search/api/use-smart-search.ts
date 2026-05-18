'use client';

import { useMutation } from '@tanstack/react-query';
import { postSmartSearch } from './smart-search.api';
import type { TSearchRequest, TSearchResponse } from '../model/types';
import { useSmartSearchStore } from '../model/smart-search.store';
import { recordSearchRequest } from '../model/throttle-tracker';

/**
 * Smart Search mutation — обёртка над postSmartSearch + sync со store.
 *
 * Mutation (а не useQuery): юзер submit'ит form (user-initiated action), не
 * declarative data fetch. Backend кеширует image SHA256 24h — повторный submit
 * того же фото получит cache hit на бэке, на фронте дополнительной обвязки
 * вокруг queryKey не нужно.
 */
export function useSmartSearch() {
    const setStatus = useSmartSearchStore((s) => s.setStatus);
    const setResponse = useSmartSearchStore((s) => s.setResponse);
    const setError = useSmartSearchStore((s) => s.setError);
    const pushRecentQuery = useSmartSearchStore((s) => s.pushRecentQuery);

    return useMutation<TSearchResponse, Error, TSearchRequest>({
        mutationFn: (body) => postSmartSearch(body),
        onMutate: (body) => {
            setStatus('loading');
            setError(null);
            recordSearchRequest();
            if (body.query) pushRecentQuery(body.query);
        },
        onSuccess: (data) => {
            setResponse({ vision: data.vision, results: data.docs });
        },
        onError: (err) => {
            setError(err.message || 'Не удалось получить результаты');
        },
    });
}
