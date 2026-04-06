import type { TOrder } from '@/entities/order';
import { useProductThumbnails } from '@/entities/product';

/**
 * Хук для загрузки превью товаров из списка заказов.
 * Инкапсулирует координацию entities order + product.
 * Автоматически дедуплицирует productIds при бесконечной прокрутке.
 */
export function useOrderThumbnails(orders: TOrder[]) {
    const productIds = [
        ...new Set(orders.flatMap((order) => Object.keys(order.cartState?.items ?? {}))),
    ];
    return useProductThumbnails(productIds);
}
