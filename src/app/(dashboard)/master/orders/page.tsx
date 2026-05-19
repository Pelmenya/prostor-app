import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { MasterOrdersListPage } from '@/views/dashboard/master-orders-list';

export const metadata: Metadata = {
    title: `Мои заказы — ${APP_NAME}`,
};

export default function MasterOrdersPage() {
    return <MasterOrdersListPage />;
}
