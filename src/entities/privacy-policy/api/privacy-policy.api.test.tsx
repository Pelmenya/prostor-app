import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useCurrentPolicy } from './privacy-policy.api';

const mockPolicy = {
    version: '1.0.0',
    content: '# Политика конфиденциальности',
    effectiveDate: '2026-01-01',
};

const server = setupServer(
    http.get('*/privacy-policy/current', () => {
        return HttpResponse.json(mockPolicy);
    }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    function Wrapper({ children }: { children: React.ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }
    return Wrapper;
}

describe('useCurrentPolicy', () => {
    it('загружает текущую политику', async () => {
        const { result } = renderHook(() => useCurrentPolicy(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockPolicy);
    });

    it('обрабатывает ошибку сервера', async () => {
        server.use(
            http.get('*/privacy-policy/current', () => {
                return new HttpResponse(null, { status: 500 });
            }),
        );

        const { result } = renderHook(() => useCurrentPolicy(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});
