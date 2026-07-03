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

// Не даёт повторно диспатчить auth:session-expired для каждого
// параллельного 401-запроса после того, как сессия уже завершена —
// иначе SessionExpiredListener делает лишние router.push() (WR-01).
let sessionExpiredNotified = false;

/**
 * Уведомляет приложение о терминальном провале refresh-токена (SESSION-04).
 * api-client.ts остаётся плоским модулем без next/navigation — навигацию
 * берёт на себя SessionExpiredListener, смонтированный в (web)/layout.tsx.
 */
function notifySessionExpired(): void {
    if (sessionExpiredNotified) return;
    sessionExpiredNotified = true;
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }
}

/**
 * Сбрасывает флаг "уже уведомили об истечении сессии". Вызывать при
 * любом успешном получении новых токенов (логин, регистрация, успешный
 * refresh) — иначе после повторного входа новое истечение сессии больше
 * не триггерит редирект на /login.
 */
export function resetSessionExpiredNotified(): void {
    sessionExpiredNotified = false;
}

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
        notifySessionExpired();
        return false;
    }

    if (refreshPromise) {
        await refreshPromise;
        return !!useAuthStore.getState().accessToken;
    }

    refreshPromise = (async () => {
        const refreshTokenAtStart = refreshToken;
        try {
            const res = await fetch(`${BASE_URL}/auth/web/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            // Сессия могла быть завершена (logout()) или уже обновлена, пока
            // этот refresh был в полёте — не применяем устаревший результат.
            if (useAuthStore.getState().refreshToken !== refreshTokenAtStart) return;

            if (!res.ok) {
                logout();
                notifySessionExpired();
                return;
            }

            const data = await res.json();
            if (useAuthStore.getState().refreshToken !== refreshTokenAtStart) return;
            if (typeof data?.accessToken !== 'string' || typeof data?.refreshToken !== 'string') {
                logout();
                notifySessionExpired();
                return;
            }
            setTokens(data.accessToken, data.refreshToken);
            sessionExpiredNotified = false;
        } catch {
            logout();
            notifySessionExpired();
        }
    })();

    try {
        await refreshPromise;
    } finally {
        refreshPromise = null;
    }

    return !!useAuthStore.getState().accessToken;
}
