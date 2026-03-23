import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiClient, ApiError } from './api-client';

function mockFetchJson(data: unknown, extra: Record<string, unknown> = {}) {
    return vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(data),
        ...extra,
    });
}

describe('apiClient', () => {
    afterEach(() => {
        vi.restoreAllMocks();
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
});
