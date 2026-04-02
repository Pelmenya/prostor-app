import type { Metadata } from 'next';
import { OrdersPage } from '@/views/orders';

export const metadata: Metadata = {
    title: 'Мои заказы — PROSTOR',
    description: 'История и статус ваших заказов.',
};

export default function OrdersRoute() {
    return <OrdersPage />;
}
