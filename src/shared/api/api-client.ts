const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

export async function apiClient<T = unknown>(
    path: string,
    options: TApiClientOptions = {},
): Promise<T> {
    const { method = 'GET', body, auth, headers = {} } = options;

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    if (auth) {
        requestHeaders['Authorization'] = auth;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
    });

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new ApiError(response.status, response.statusText, data);
    }

    return response.json() as Promise<T>;
}
