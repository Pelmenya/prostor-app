import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

// cache() из React гарантирует один QueryClient на один серверный запрос.
// На клиенте getQueryClient не используется — там QueryProvider создаёт
// собственный экземпляр через useState.
export const getQueryClient = cache(
    () =>
        new QueryClient({
            defaultOptions: {
                queries: {
                    staleTime: 60 * 1000,
                    retry: 1,
                },
            },
        }),
);
