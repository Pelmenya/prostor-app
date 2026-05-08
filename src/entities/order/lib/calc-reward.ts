import type { TOrder } from '../model/types/t-order';

const COMMISSION_PERCENT = Number(process.env.NEXT_PUBLIC_COMMISSION_PERCENTS ?? '15');
const COMMISSION_RATE = (100 - COMMISSION_PERCENT) / 100;

/**
 * Считает выплату мастеру за заказ (в рублях).
 * Цены в cartState хранятся в копейках — делим на 100.
 */
export function calcReward(order: TOrder): number {
    const totalServices = order.cartState?.totalServicesPrice ?? 0;
    const totalProducts = order.cartState?.totalProductsPrice ?? 0;
    const deliveryCost = order.deliveryCost ?? 0;
    const totalAmount = order.totalAmount ?? 0;

    const servicesReward = Math.max(0, totalServices - deliveryCost);
    const visitReward = Math.max(0, totalAmount - totalProducts - totalServices - deliveryCost);

    return ((servicesReward + visitReward) / 100) * COMMISSION_RATE;
}
