import { describe, it, expect, vi, afterEach } from 'vitest';
import type { TSalePrice } from '@/shared/model';

const mockPrices: TSalePrice[] = [
    {
        value: 1500000,
        currency: {} as TSalePrice['currency'],
        priceType: { name: 'Приложение' } as TSalePrice['priceType'],
    },
    {
        value: 2000000,
        currency: {} as TSalePrice['currency'],
        priceType: { name: 'Розница' } as TSalePrice['priceType'],
    },
    {
        value: 1800000,
        currency: {} as TSalePrice['currency'],
        priceType: { name: 'Акция' } as TSalePrice['priceType'],
    },
];

describe('getSalePrices', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it('возвращает пустой массив если prices undefined', async () => {
        const { getSalePrices } = await import('./get-sale-prices');
        expect(getSalePrices(undefined)).toEqual([]);
    });

    it('возвращает пустой массив если prices пустой', async () => {
        const { getSalePrices } = await import('./get-sale-prices');
        expect(getSalePrices([])).toEqual([]);
    });

    it('фильтрует цены по дефолтному значению Приложение', async () => {
        const { getSalePrices } = await import('./get-sale-prices');
        const result = getSalePrices(mockPrices);
        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(1500000);
    });

    it('фильтрует по нескольким типам через __', async () => {
        vi.stubEnv('NEXT_PUBLIC_SALE_PRICES', 'Приложение__Акция');
        vi.resetModules();
        const { getSalePrices } = await import('./get-sale-prices');
        const result = getSalePrices(mockPrices);
        expect(result).toHaveLength(2);
        expect(result.map((p) => p.value)).toContain(1500000);
        expect(result.map((p) => p.value)).toContain(1800000);
    });

    it('фолбэк работает при пустой строке env', async () => {
        vi.stubEnv('NEXT_PUBLIC_SALE_PRICES', '');
        vi.resetModules();
        const { getSalePrices } = await import('./get-sale-prices');
        const result = getSalePrices(mockPrices);
        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(1500000);
    });
});
