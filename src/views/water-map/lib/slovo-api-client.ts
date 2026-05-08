import { SLOVO_API_URL } from '@/shared/config';

/**
 * Минималистичный fetch для slovo-api. Не используется shared/api/api-client
 * потому что:
 *  - slovo-api живёт на отдельном origin (NEXT_PUBLIC_SLOVO_API_URL);
 *  - не нуждается в auth refresh / Bearer (water-analysis endpoints — public,
 *    throttle по IP);
 *  - GET с typed query через простой builder без класс-валидации.
 *
 * Ошибка кидается как обычная Error с status в message — TanStack Query сам
 * выставит isError + retry.
 */
export class SlovoApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly statusText: string,
        public readonly body: unknown,
    ) {
        super(`SlovoApi ${status} ${statusText}`);
        this.name = 'SlovoApiError';
    }
}

type TQueryValue = string | number | boolean | undefined | null;
type TQueryParams = Record<string, TQueryValue>;

function buildQueryString(params: TQueryParams): string {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null) continue;
        search.set(k, String(v));
    }
    const s = search.toString();
    return s ? `?${s}` : '';
}

export async function slovoGet<T>(
    path: string,
    query: TQueryParams = {},
    signal?: AbortSignal,
): Promise<T> {
    const url = `${SLOVO_API_URL}${path}${buildQueryString(query)}`;
    const res = await fetch(url, { signal });
    if (!res.ok) {
        const body: unknown = await res.json().catch(() => null);
        throw new SlovoApiError(res.status, res.statusText, body);
    }
    return (await res.json()) as T;
}

export async function slovoPost<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
    const url = `${SLOVO_API_URL}${path}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
    });
    if (!res.ok) {
        const errBody: unknown = await res.json().catch(() => null);
        throw new SlovoApiError(res.status, res.statusText, errBody);
    }
    return (await res.json()) as T;
}
