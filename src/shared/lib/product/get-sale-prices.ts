import type { TSalePrice } from '@/shared/model';

const SALE_PRICE_TYPES = (process.env.NEXT_PUBLIC_SALE_PRICES ?? 'Приложение').split('__');

export function getSalePrices(prices?: TSalePrice[]): TSalePrice[] {
    if (!prices) return [];
    return prices.filter(
        (price) => price.priceType.name && SALE_PRICE_TYPES.includes(price.priceType.name),
    );
}
