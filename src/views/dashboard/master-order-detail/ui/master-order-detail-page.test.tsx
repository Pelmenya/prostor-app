import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { MasterOrderDetailPage } from './master-order-detail-page';
import { EOrderStatus, EPaymentStatus } from '@/entities/order';

vi.mock('next/navigation', () => ({
    notFound: vi.fn(),
    useRouter: vi.fn().mockReturnValue({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/entities/order', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/entities/order')>();
    return {
        ...actual,
        useGetOrderById: vi.fn(),
        useUpdateOrderStatus: vi.fn().mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
            reset: vi.fn(),
        }),
    };
});

vi.mock('@/entities/user', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/entities/user')>();
    return {
        ...actual,
        useCurrentUserSuspense: vi.fn(),
    };
});

vi.mock('@/features/orders', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/features/orders')>();
    return {
        ...actual,
        useSingleOrderThumbnails: vi.fn().mockReturnValue({ imageUrls: {}, loadingIds: new Set() }),
    };
});

vi.mock('./client-card', () => ({ ClientCard: () => null }));
vi.mock('./address-card', () => ({ AddressCard: () => null }));
vi.mock('./schedule-card', () => ({ ScheduleCard: () => null }));
vi.mock('./master-order-actions', () => ({ MasterOrderActions: () => null }));

import { notFound } from 'next/navigation';
import { useGetOrderById, useUpdateOrderStatus } from '@/entities/order';
import { useCurrentUserSuspense } from '@/entities/user';

const MOCK_USER = {
    id: 42,
    uuid: 'uuid-42',
    first_name: 'Пётр',
    last_name: 'Иванов',
    role: 'service',
    is_auth: true,
};

const MOCK_ORDER = {
    id: 1,
    status: EOrderStatus.PENDING,
    cartState: { items: {} },
    paymentStatus: EPaymentStatus.FREE,
    totalAmount: 0,
    currency: 'RUB',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    executor: null,
    client: null,
    realEstate: null,
    scheduledDate: null,
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

describe('MasterOrderDetailPage — PII guard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useUpdateOrderStatus).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
            reset: vi.fn(),
        } as unknown as ReturnType<typeof useUpdateOrderStatus>);
    });

    it('заказ без исполнителя (PENDING) — рендерится без вызова notFound', () => {
        vi.mocked(useGetOrderById).mockReturnValue({
            data: { ...MOCK_ORDER, executor: undefined },
        } as unknown as ReturnType<typeof useGetOrderById>);
        vi.mocked(useCurrentUserSuspense).mockReturnValue({
            data: MOCK_USER,
        } as unknown as ReturnType<typeof useCurrentUserSuspense>);

        render(<MasterOrderDetailPage orderId={1} />, { wrapper: createWrapper() });

        expect(notFound).not.toHaveBeenCalled();
    });

    it('executor.id совпадает с user.id — рендерится без вызова notFound', () => {
        vi.mocked(useGetOrderById).mockReturnValue({
            data: { ...MOCK_ORDER, executor: { ...MOCK_USER, id: 42 } },
        } as unknown as ReturnType<typeof useGetOrderById>);
        vi.mocked(useCurrentUserSuspense).mockReturnValue({
            data: MOCK_USER,
        } as unknown as ReturnType<typeof useCurrentUserSuspense>);

        render(<MasterOrderDetailPage orderId={1} />, { wrapper: createWrapper() });

        expect(notFound).not.toHaveBeenCalled();
    });

    it('executor.id не совпадает с user.id — вызывает notFound', () => {
        vi.mocked(useGetOrderById).mockReturnValue({
            data: { ...MOCK_ORDER, executor: { ...MOCK_USER, id: 99 } },
        } as unknown as ReturnType<typeof useGetOrderById>);
        vi.mocked(useCurrentUserSuspense).mockReturnValue({
            data: MOCK_USER,
        } as unknown as ReturnType<typeof useCurrentUserSuspense>);

        render(<MasterOrderDetailPage orderId={1} />, { wrapper: createWrapper() });

        expect(notFound).toHaveBeenCalledOnce();
    });
});
