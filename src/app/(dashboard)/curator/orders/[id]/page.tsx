import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { CuratorOrderDetailPage } from '@/views/dashboard/curator-order-detail';

export const metadata: Metadata = {
    title: `Заказ — ${APP_NAME}`,
};

type TProps = {
    params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: TProps) {
    const { id } = await params;
    return <CuratorOrderDetailPage id={id} />;
}
