import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { MasterOrdersListPage } from './master-orders-list-page';
import { EOrderStatus, EPaymentStatus } from '@/entities/order';
import { TAB_STATUS_PRESETS } from '@/features/orders';

vi.mock('next/navigation', () => ({
    useRouter: vi.fn().mockReturnValue({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/entities/order', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/entities/order')>();
    return {
        ...actual,
        useGetOrders: vi.fn(),
        MasterOrderCard: ({ order }: { order: { id: number } }) => (
            <div data-testid="master-order-card">{order.id}</div>
        ),
    };
});

vi.mock('@/features/orders', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/features/orders')>();
    return {
        ...actual,
        useOrderThumbnails: vi.fn().mockReturnValue({ imageUrls: {}, loadingIds: new Set() }),
    };
});

import { useGetOrders } from '@/entities/order';

const MOCK_ORDER = {
    id: 1,
    status: EOrderStatus.PENDING,
    cartState: { items: {} },
    paymentStatus: EPaymentStatus.FREE,
    totalAmount: 0,
    currency: 'RUB',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
};

const EMPTY_RESULT = {
    data: { pages: [{ items: [], nextCursor: null, hasMore: false }] },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
};

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
        return createElement(QueryClientProvider, { client: queryClient }, children);
    }
    return Wrapper;
}

describe('MasterOrdersListPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useGetOrders).mockReturnValue(
            EMPTY_RESULT as unknown as ReturnType<typeof useGetOrders>,
        );
    });

    it('показывает "нет заказов" когда список пустой', () => {
        render(<MasterOrdersListPage />, { wrapper: createWrapper() });
        expect(screen.getByText('У вас нет заказов')).toBeInTheDocument();
    });

    it('показывает карточки заказов когда данные есть', () => {
        vi.mocked(useGetOrders).mockReturnValue({
            ...EMPTY_RESULT,
            data: { pages: [{ items: [MOCK_ORDER], nextCursor: null, hasMore: false }] },
        } as unknown as ReturnType<typeof useGetOrders>);

        render(<MasterOrdersListPage />, { wrapper: createWrapper() });

        expect(screen.getByTestId('master-order-card')).toBeInTheDocument();
    });

    it('при переключении на вкладку "Выполненные" передаёт completed statusFilter', async () => {
        const user = userEvent.setup();
        render(<MasterOrdersListPage />, { wrapper: createWrapper() });

        await user.click(screen.getByRole('tab', { name: /Выполненные/ }));

        const lastCallArgs = vi.mocked(useGetOrders).mock.lastCall?.[0];
        expect(lastCallArgs?.status).toEqual([...TAB_STATUS_PRESETS.completed]);
    });

    it('при инициализации передаёт actual statusFilter', () => {
        render(<MasterOrdersListPage />, { wrapper: createWrapper() });

        const firstCallArgs = vi.mocked(useGetOrders).mock.calls[0]?.[0];
        expect(firstCallArgs?.status).toEqual([...TAB_STATUS_PRESETS.actual]);
    });
});
