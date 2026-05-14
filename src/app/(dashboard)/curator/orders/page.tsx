import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { CuratorOrdersPage } from '@/views/dashboard/curator-orders';

export const metadata: Metadata = {
    title: `Заказы — ${APP_NAME}`,
};

export default function OrdersPage() {
    return <CuratorOrdersPage />;
}
