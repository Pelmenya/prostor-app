import type { Metadata } from 'next';
import { OrdersClient } from './orders-client';

export const metadata: Metadata = {
    title: 'Мои заказы — PROSTOR',
    description: 'История и статус ваших заказов.',
};

export default function OrdersRoute() {
    return <OrdersClient />;
}
