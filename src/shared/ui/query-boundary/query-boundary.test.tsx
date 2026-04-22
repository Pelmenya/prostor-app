import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider, useSuspenseQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { QueryBoundary } from './query-boundary';

function makeWrapper(queryClient: QueryClient) {
    return function TestWrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

const mockFetcher = vi.fn();

function DataComponent() {
    const { data } = useSuspenseQuery<string>({
        queryKey: ['test-query'],
        queryFn: mockFetcher,
    });
    return <div data-testid="data">{data}</div>;
}

describe('QueryBoundary', () => {
    it('показывает данные после успешной загрузки', async () => {
        mockFetcher.mockResolvedValue('hello');
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });

        render(
            <QueryBoundary>
                <DataComponent />
            </QueryBoundary>,
            { wrapper: makeWrapper(queryClient) },
        );

        await waitFor(() => expect(screen.getByTestId('data')).toBeInTheDocument());
        expect(screen.getByTestId('data').textContent).toBe('hello');
    });

    it('показывает сообщение ошибки при неудачном запросе', async () => {
        mockFetcher.mockRejectedValue(new Error('fail'));
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });

        render(
            <QueryBoundary errorMessage="Тест ошибки">
                <DataComponent />
            </QueryBoundary>,
            { wrapper: makeWrapper(queryClient) },
        );

        await waitFor(() => expect(screen.getByText('Тест ошибки')).toBeInTheDocument());
    });

    it('retry сбрасывает кешированную ошибку через QueryErrorResetBoundary и повторяет запрос', async () => {
        mockFetcher
            .mockRejectedValueOnce(new Error('first fail'))
            .mockResolvedValueOnce('recovered');

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });

        render(
            <QueryBoundary errorMessage="Ошибка">
                <DataComponent />
            </QueryBoundary>,
            { wrapper: makeWrapper(queryClient) },
        );

        await waitFor(() => expect(screen.getByText('Ошибка')).toBeInTheDocument());

        const retryButton = screen.getByRole('button', { name: /попробовать снова/i });
        await userEvent.click(retryButton);

        await waitFor(() => expect(screen.getByTestId('data')).toBeInTheDocument());
        expect(screen.getByTestId('data').textContent).toBe('recovered');
    });
});
