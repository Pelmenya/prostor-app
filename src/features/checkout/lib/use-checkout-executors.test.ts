import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckoutExecutors } from './use-checkout-executors';

const mockFetchExecutors = vi.fn();
vi.mock('../api/executor.api', () => ({
    useFilteredExecutors: () => ({ mutateAsync: mockFetchExecutors }),
}));

vi.mock('@/shared/lib', async (importOriginal) => {
    const mod = await importOriginal<typeof import('@/shared/lib')>();
    return {
        ...mod,
        sleep: vi.fn().mockResolvedValue(undefined),
        // retryAsync вызывает sleep внутри того же модуля — мокаем его целиком,
        // чтобы тесты не зависели от реальных задержек
        retryAsync: vi.fn().mockImplementation((fn: () => Promise<unknown>) => fn()),
    };
});

const defaultParams = { serviceIds: [], productItems: [] };

const mockExecutors = [{ user: { id: 1, first_name: 'Иван', last_name: 'Иванов' }, workDays: [] }];

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useCheckoutExecutors', () => {
    it('начальное состояние — idle, пустой список', () => {
        const { result } = renderHook(() => useCheckoutExecutors(defaultParams));

        expect(result.current.executorsSearchStatus).toBe('idle');
        expect(result.current.executorsWithWorkDays).toEqual([]);
        expect(result.current.hasMasters).toBeNull();
    });

    it('успешно загружает мастеров', async () => {
        mockFetchExecutors.mockResolvedValueOnce({
            executors: mockExecutors,
            allMastersRejectedByCargo: false,
            hasProductsWithoutDimensions: false,
        });

        const { result } = renderHook(() => useCheckoutExecutors(defaultParams));

        await act(async () => {
            await result.current.loadExecutors(1);
        });

        expect(result.current.executorsSearchStatus).toBe('success');
        expect(result.current.executorsWithWorkDays).toEqual(mockExecutors);
        expect(result.current.hasMasters).toBe(true);
    });

    it('устанавливает hasMasters=false если список пустой', async () => {
        mockFetchExecutors.mockResolvedValueOnce({
            executors: [],
            allMastersRejectedByCargo: false,
            hasProductsWithoutDimensions: false,
        });

        const { result } = renderHook(() => useCheckoutExecutors(defaultParams));

        await act(async () => {
            await result.current.loadExecutors(1);
        });

        expect(result.current.hasMasters).toBe(false);
    });

    it('устанавливает статус failed после исчерпания попыток', async () => {
        mockFetchExecutors.mockRejectedValue(new Error('network'));

        const { result } = renderHook(() => useCheckoutExecutors(defaultParams));

        await act(async () => {
            await result.current.loadExecutors(1);
        });

        expect(result.current.executorsSearchStatus).toBe('failed');
        expect(result.current.hasMasters).toBe(false);
    });

    it('resetExecutors сбрасывает состояние', async () => {
        mockFetchExecutors.mockResolvedValueOnce({
            executors: mockExecutors,
            allMastersRejectedByCargo: false,
            hasProductsWithoutDimensions: false,
        });

        const { result } = renderHook(() => useCheckoutExecutors(defaultParams));

        await act(async () => {
            await result.current.loadExecutors(1);
        });

        act(() => {
            result.current.resetExecutors();
        });

        expect(result.current.executorsSearchStatus).toBe('idle');
        expect(result.current.executorsWithWorkDays).toEqual([]);
        expect(result.current.hasMasters).toBeNull();
    });
});
