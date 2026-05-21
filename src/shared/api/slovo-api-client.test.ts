import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { slovoGet, slovoPost, SlovoApiError } from './slovo-api-client';

/**
 * Tests для slovo-api-client. Powers и water-map endpoints и smart-search
 * `/catalog/search` — bug на этом уровне = двойной regression. Cover:
 *  - slovoGet/slovoPost happy path → typed return
 *  - 4xx/5xx → throws SlovoApiError с status/statusText/body
 *  - Non-JSON error body → body=null (не throws)
 *  - credentials: 'omit' в fetch options (security posture)
 *  - buildQueryString: skips null/undefined, coerces boolean/number, encodes
 *  - AbortSignal propagation
 */

const FETCH_OK_JSON = (data: unknown) =>
    Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(data),
    } as unknown as Response);

const FETCH_ERROR = (status: number, statusText: string, body: unknown = null) =>
    Promise.resolve({
        ok: false,
        status,
        statusText,
        json: () => (body === null ? Promise.reject(new Error('no json')) : Promise.resolve(body)),
    } as unknown as Response);

describe('slovo-api-client', () => {
    const originalFetch = global.fetch;
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        global.fetch = fetchMock;
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    describe('slovoGet', () => {
        it('200 OK → typed return', async () => {
            fetchMock.mockReturnValueOnce(FETCH_OK_JSON({ count: 3, docs: [] }));
            const result = await slovoGet<{ count: number; docs: unknown[] }>(
                '/water-analysis/heatmap',
            );
            expect(result).toEqual({ count: 3, docs: [] });
        });

        it('strips null/undefined из query, coerces boolean/number', async () => {
            fetchMock.mockReturnValueOnce(FETCH_OK_JSON({}));
            await slovoGet('/test', {
                a: 'str',
                b: 123,
                c: true,
                d: null,
                e: undefined,
            });
            const url = fetchMock.mock.calls[0][0] as string;
            expect(url).toContain('a=str');
            expect(url).toContain('b=123');
            expect(url).toContain('c=true');
            expect(url).not.toContain('d=');
            expect(url).not.toContain('e=');
        });

        it('passes credentials: omit (security posture)', async () => {
            fetchMock.mockReturnValueOnce(FETCH_OK_JSON({}));
            await slovoGet('/test');
            const opts = fetchMock.mock.calls[0][1] as RequestInit;
            expect(opts.credentials).toBe('omit');
        });

        it('passes signal', async () => {
            fetchMock.mockReturnValueOnce(FETCH_OK_JSON({}));
            const controller = new AbortController();
            await slovoGet('/test', {}, controller.signal);
            const opts = fetchMock.mock.calls[0][1] as RequestInit;
            expect(opts.signal).toBe(controller.signal);
        });

        it('429 throttle → throws SlovoApiError с status/statusText/body', async () => {
            fetchMock.mockReturnValueOnce(
                FETCH_ERROR(429, 'Too Many Requests', { message: 'Rate limited' }),
            );
            await expect(slovoGet('/test')).rejects.toMatchObject({
                name: 'SlovoApiError',
                status: 429,
                statusText: 'Too Many Requests',
                body: { message: 'Rate limited' },
            });
        });

        it('500 без JSON body → body=null (НЕ throws на json parse)', async () => {
            fetchMock.mockReturnValueOnce(FETCH_ERROR(500, 'Internal Server Error', null));
            await expect(slovoGet('/test')).rejects.toMatchObject({
                name: 'SlovoApiError',
                status: 500,
                body: null,
            });
        });

        it('пустой query → URL без `?`', async () => {
            fetchMock.mockReturnValueOnce(FETCH_OK_JSON({}));
            await slovoGet('/test');
            const url = fetchMock.mock.calls[0][0] as string;
            expect(url).not.toContain('?');
        });
    });

    describe('slovoPost', () => {
        it('200 OK → typed return + JSON body', async () => {
            fetchMock.mockReturnValueOnce(FETCH_OK_JSON({ ok: true, id: 'abc' }));
            const result = await slovoPost<{ ok: boolean; id: string }>('/catalog/search', {
                query: 'test',
                topK: 5,
            });
            expect(result).toEqual({ ok: true, id: 'abc' });
            const opts = fetchMock.mock.calls[0][1] as RequestInit;
            expect(opts.method).toBe('POST');
            expect(opts.body).toBe(JSON.stringify({ query: 'test', topK: 5 }));
            expect((opts.headers as Record<string, string>)['Content-Type']).toBe(
                'application/json',
            );
        });

        it('passes credentials: omit', async () => {
            fetchMock.mockReturnValueOnce(FETCH_OK_JSON({}));
            await slovoPost('/test', { x: 1 });
            const opts = fetchMock.mock.calls[0][1] as RequestInit;
            expect(opts.credentials).toBe('omit');
        });

        it('passes signal', async () => {
            fetchMock.mockReturnValueOnce(FETCH_OK_JSON({}));
            const controller = new AbortController();
            await slovoPost('/test', {}, controller.signal);
            const opts = fetchMock.mock.calls[0][1] as RequestInit;
            expect(opts.signal).toBe(controller.signal);
        });

        it('400 error → throws SlovoApiError', async () => {
            fetchMock.mockReturnValueOnce(
                FETCH_ERROR(400, 'Bad Request', { error: 'Invalid query' }),
            );
            await expect(slovoPost('/test', {})).rejects.toMatchObject({
                name: 'SlovoApiError',
                status: 400,
                body: { error: 'Invalid query' },
            });
        });
    });

    describe('SlovoApiError', () => {
        it('instanceof Error + .name + .status', () => {
            const err = new SlovoApiError(404, 'Not Found', { message: 'no' });
            expect(err).toBeInstanceOf(Error);
            expect(err.name).toBe('SlovoApiError');
            expect(err.status).toBe(404);
            expect(err.message).toContain('SlovoApi 404 Not Found');
        });
    });
});
