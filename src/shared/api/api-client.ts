import { API_URL as BASE_URL } from '@/shared/config';
import { useAuthStore } from '@/shared/lib/auth';

function getBaseUrl(): string {
    if (typeof window === 'undefined') {
        return process.env.BUILD_API_URL || process.env.INTERNAL_API_URL || BASE_URL;
    }
    return BASE_URL;
}

export class ApiError extends Error {
    constructor(
        public status: number,
        public statusText: string,
        public data: unknown,
    ) {
        super(`API Error: ${status} ${statusText}`);
        this.name = 'ApiError';
    }
}

export type TApiClientOptions = {
    method?: string;
    body?: unknown;
    auth?: string | null;
    headers?: Record<string, string>;
};

type TApiClientInternalOptions = TApiClientOptions & { _retry?: boolean };

let refreshPromise: Promise<void> | null = null;

export async function apiClient<T = unknown>(
    path: string,
    options: TApiClientOptions = {},
): Promise<T> {
    const internal = options as TApiClientInternalOptions;
    const { method = 'GET', body, auth, headers = {} } = options;
    const _retry = internal._retry ?? false;

    const requestHeaders: Record<string, string> = { ...headers };

    const isFormData = body instanceof FormData;
    if (body && !isFormData) {
        requestHeaders['Content-Type'] = 'application/json';
    }

    if (auth) {
        requestHeaders['Authorization'] = auth;
    }

    const response = await fetch(`${getBaseUrl()}${path}`, {
        method,
        headers: requestHeaders,
        body: isFormData ? body : body ? JSON.stringify(body) : undefined,
        credentials: 'include',
    });

    if (!response.ok) {
        if (response.status === 401 && !_retry && typeof window !== 'undefined') {
            const refreshed = await tryRefreshTokens();
            if (refreshed) {
                const newToken = useAuthStore.getState().accessToken;
                return apiClient<T>(path, {
                    ...options,
                    auth: newToken ? `Bearer ${newToken}` : null,
                    _retry: true,
                } as TApiClientInternalOptions);
            }
        }

        const data = await response.json().catch(() => null);
        throw new ApiError(response.status, response.statusText, data);
    }

    // 204 No Content или пустое тело
    const contentType = response.headers.get('content-type');
    if (response.status === 204 || !contentType?.includes('application/json')) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

async function tryRefreshTokens(): Promise<boolean> {
    const { refreshToken, logout, setTokens } = useAuthStore.getState();

    if (!refreshToken) {
        logout();
        return false;
    }

    if (refreshPromise) {
        await refreshPromise;
        return !!useAuthStore.getState().accessToken;
    }

    refreshPromise = (async () => {
        try {
            const res = await fetch(`${BASE_URL}/auth/web/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (!res.ok) {
                logout();
                return;
            }

            const data = await res.json();
            setTokens(data.accessToken, data.refreshToken);
        } catch {
            logout();
        }
    })();

    await refreshPromise;
    refreshPromise = null;

    return !!useAuthStore.getState().accessToken;
}
