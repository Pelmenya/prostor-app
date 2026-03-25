import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';
import { cache } from 'react';

// Единая конфигурация — используется и серверным, и клиентским QueryClient.
export const QUERY_CLIENT_OPTIONS: QueryClientConfig = {
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
            retry: 1,
        },
    },
};

// cache() из React гарантирует один QueryClient на один серверный запрос.
// На клиенте getQueryClient не используется — там QueryProvider создаёт
// собственный экземпляр через useState.
export const getQueryClient = cache(() => new QueryClient(QUERY_CLIENT_OPTIONS));
