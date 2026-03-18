import { useAuth } from '@/shared/lib/messenger';
import { apiClient } from './api-client';
import type { TApiClientOptions } from './api-client';

export function useApi() {
    const { authHeader } = useAuth();

    return <T = unknown>(path: string, options?: Omit<TApiClientOptions, 'auth'>) =>
        apiClient<T>(path, { ...options, auth: authHeader });
}
