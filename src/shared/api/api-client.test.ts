import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiClient, ApiError, resetSessionExpiredNotified } from './api-client';
import { useAuthStore } from '@/shared/lib/auth';

function mockFetchJson(data: unknown, extra: Record<string, unknown> = {}) {
    return vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(data),
        ...extra,
    });
}

function createDeferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return { promise, resolve };
}

const initialAuthState = useAuthStore.getState();

describe('apiClient', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        useAuthStore.setState(initialAuthState, true);
        resetSessionExpiredNotified();
        localStorage.clear();
    });

    it('отправляет GET-запрос на правильный URL', async () => {
        vi.stubGlobal('fetch', mockFetchJson({ id: 1 }));

        const result = await apiClient('/test');

        expect(result).toEqual({ id: 1 });
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/test'),
            expect.objectContaining({ method: 'GET' }),
        );
    });

    it('добавляет Authorization при наличии auth', async () => {
        vi.stubGlobal('fetch', mockFetchJson({}));

        await apiClient('/test', { auth: 'tma test-data' });

        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'tma test-data',
                }),
            }),
        );
    });

    it('не добавляет Authorization без auth', async () => {
        vi.stubGlobal('fetch', mockFetchJson({}));

        await apiClient('/test');

        const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(callArgs[1].headers).not.toHaveProperty('Authorization');
    });

    it('добавляет Content-Type только при наличии body', async () => {
        vi.stubGlobal('fetch', mockFetchJson({}));

        // GET без body — нет Content-Type
        await apiClient('/test');
        let headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
        expect(headers).not.toHaveProperty('Content-Type');

        // POST с body — есть Content-Type
        await apiClient('/test', { method: 'POST', body: { data: 1 } });
        headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].headers;
        expect(headers['Content-Type']).toBe('application/json');
    });

    it('выбрасывает ApiError при ошибке ответа', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                json: () => Promise.resolve({ message: 'Invalid token' }),
            }),
        );

        await expect(apiClient('/test')).rejects.toThrow(ApiError);
        await expect(apiClient('/test')).rejects.toMatchObject({ status: 401 });
    });

    it('отправляет POST с JSON body', async () => {
        vi.stubGlobal('fetch', mockFetchJson({ success: true }));

        await apiClient('/test', { method: 'POST', body: { name: 'test' } });

        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ name: 'test' }),
            }),
        );
    });

    it('дедуплицирует параллельные refresh-запросы (single-flight) и обновляет обе пары токенов', async () => {
        useAuthStore.setState({
            accessToken: 'expired-access',
            refreshToken: 'refresh-1',
            isAuthenticated: true,
        });

        const refreshDeferred = createDeferred<{
            ok: boolean;
            status: number;
            json: () => Promise<unknown>;
            headers: Headers;
        }>();

        const fetchMock = vi
            .fn()
            // request A → 401
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                json: async () => ({}),
            })
            // request B → 401
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                json: async () => ({}),
            })
            // единственный POST /auth/web/refresh, удерживаемый открытым до resolve
            .mockImplementationOnce(() => refreshDeferred.promise)
            // повтор A
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({ a: 1 }),
            })
            // повтор B
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({ b: 1 }),
            });

        vi.stubGlobal('fetch', fetchMock);

        const resultA = apiClient('/a', { auth: 'Bearer expired-access' });
        const resultB = apiClient('/b', { auth: 'Bearer expired-access' });

        refreshDeferred.resolve({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
        });

        const [dataA, dataB] = await Promise.all([resultA, resultB]);

        const refreshCalls = fetchMock.mock.calls.filter(([url]) =>
            String(url).includes('/auth/web/refresh'),
        );
        expect(refreshCalls).toHaveLength(1); // SESSION-02: ровно один refresh-запрос

        const { accessToken, refreshToken } = useAuthStore.getState();
        expect(accessToken).toBe('new-access'); // SESSION-03
        expect(refreshToken).toBe('new-refresh'); // SESSION-03

        expect(dataA).toEqual({ a: 1 });
        expect(dataB).toEqual({ b: 1 });
    });

    it('терминальный 401 на refresh очищает токены и диспатчит auth:session-expired, повторный запрос не делает второй refresh', async () => {
        useAuthStore.setState({
            accessToken: 'expired-access',
            refreshToken: 'refresh-1',
            isAuthenticated: true,
        });

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        const fetchMock = vi
            .fn()
            // оригинальный запрос /test → 401
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                json: async () => ({}),
            })
            // POST /auth/web/refresh → терминальная ошибка (401)
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                json: async () => ({}),
            });

        vi.stubGlobal('fetch', fetchMock);

        await expect(apiClient('/test', { auth: 'Bearer expired-access' })).rejects.toMatchObject({
            status: 401,
        });

        expect(useAuthStore.getState().accessToken).toBeNull();

        const sessionExpiredCalls = dispatchSpy.mock.calls.filter(
            ([event]) => (event as Event).type === 'auth:session-expired',
        );
        expect(sessionExpiredCalls).toHaveLength(1);

        // Pitfall 4: follow-up запрос после очистки токенов не делает второй /auth/web/refresh
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            json: async () => ({}),
        });

        await expect(apiClient('/test2')).rejects.toMatchObject({ status: 401 });

        const refreshCalls = fetchMock.mock.calls.filter(([url]) =>
            String(url).includes('/auth/web/refresh'),
        );
        expect(refreshCalls).toHaveLength(1);

        // WR-01: повторный 401 после уже истёкшей сессии не должен диспатчить
        // auth:session-expired ещё раз (one-shot guard)
        const sessionExpiredCallsAfterSecondRequest = dispatchSpy.mock.calls.filter(
            ([event]) => (event as Event).type === 'auth:session-expired',
        );
        expect(sessionExpiredCallsAfterSecondRequest).toHaveLength(1);
    });

    it('сетевая ошибка при refresh (catch) тоже очищает токены и диспатчит auth:session-expired', async () => {
        useAuthStore.setState({
            accessToken: 'expired-access',
            refreshToken: 'refresh-1',
            isAuthenticated: true,
        });

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        const fetchMock = vi
            .fn()
            // оригинальный запрос /test → 401
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                json: async () => ({}),
            })
            // POST /auth/web/refresh → сетевая ошибка
            .mockRejectedValueOnce(new Error('network error'));

        vi.stubGlobal('fetch', fetchMock);

        await expect(apiClient('/test', { auth: 'Bearer expired-access' })).rejects.toMatchObject({
            status: 401,
        });

        expect(useAuthStore.getState().accessToken).toBeNull();

        const sessionExpiredCalls = dispatchSpy.mock.calls.filter(
            ([event]) => (event as Event).type === 'auth:session-expired',
        );
        expect(sessionExpiredCalls).toHaveLength(1);
    });
});
