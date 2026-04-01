import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckoutSubmit, isEmailValid } from './use-checkout-submit';
import { useCheckoutStore } from '../model/checkout.store';
import { EDeliveryType } from '@/entities/order';

// Мокаем зависимости
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace: mockReplace }),
}));

const mockInvalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

const mockCreateOrder = vi.fn();
vi.mock('@/entities/order', async (importOriginal) => {
    const mod = await importOriginal<typeof import('@/entities/order')>();
    return { ...mod, useCreateOrder: () => ({ mutateAsync: mockCreateOrder }) };
});

vi.mock('@/entities/cart', () => ({
    useCart: () => ({ data: { id: 'cart-1' } }),
    CART_QUERY_KEY: ['cart'],
}));

vi.mock('@/shared/lib/platform', () => ({
    useAuth: () => ({ user: { id: 1, email: 'test@test.com' } }),
}));

vi.mock('@/shared/lib', async (importOriginal) => {
    const mod = await importOriginal<typeof import('@/shared/lib')>();
    return { ...mod, sleep: vi.fn().mockResolvedValue(undefined) };
});

const defaultParams = {
    deliveryType: EDeliveryType.MASTER_DELIVERY,
    hasProducts: false,
    activeTab: 'master_delivery' as const,
    selectedExecutor: null,
    desiredIntervalDate: null,
    clientComment: '',
    receiptEmail: '',
};

beforeEach(() => {
    vi.clearAllMocks();
    useCheckoutStore.setState({ selectedRealEstateId: 1, selectedPickupStore: null });
});

describe('isEmailValid', () => {
    it('принимает валидный email', () => {
        expect(isEmailValid('user@example.com')).toBe(true);
    });

    it('отклоняет невалидный email', () => {
        expect(isEmailValid('not-an-email')).toBe(false);
        expect(isEmailValid('')).toBe(false);
    });
});

describe('useCheckoutSubmit', () => {
    it('успешно создаёт заказ и редиректит', async () => {
        mockCreateOrder.mockResolvedValueOnce({ id: 99 });

        const { result } = renderHook(() => useCheckoutSubmit(defaultParams));

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(mockCreateOrder).toHaveBeenCalledOnce();
        expect(mockInvalidateQueries).toHaveBeenCalledOnce();
        expect(mockReplace).toHaveBeenCalledWith('/orders/99');
    });

    it('блокирует двойной сабмит', async () => {
        let resolveFn!: () => void;
        mockCreateOrder.mockReturnValueOnce(
            new Promise<{ id: number }>((res) => {
                resolveFn = () => res({ id: 1 });
            }),
        );

        const { result } = renderHook(() => useCheckoutSubmit(defaultParams));

        // Запускаем первый сабмит (не завершаем)
        act(() => {
            result.current.handleSubmit();
        });
        // Второй сабмит должен быть заблокирован
        await act(async () => {
            await result.current.handleSubmit();
        });

        resolveFn();
        await act(async () => {
            await Promise.resolve();
        });

        expect(mockCreateOrder).toHaveBeenCalledTimes(1);
    });

    it('показывает ошибку после MAX_RETRY_ATTEMPTS попыток', async () => {
        mockCreateOrder.mockRejectedValue(new Error('network error'));

        const { result } = renderHook(() => useCheckoutSubmit(defaultParams));

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(result.current.orderError).toMatch(/Ошибка при оформлении/);
    });

    it('не создаёт заказ если не выбран объект недвижимости', async () => {
        useCheckoutStore.setState({ selectedRealEstateId: null });

        const { result } = renderHook(() => useCheckoutSubmit(defaultParams));

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(mockCreateOrder).not.toHaveBeenCalled();
    });
});
