import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { MasterOrderDetailPage } from '@/views/dashboard/master-order-detail';

type TProps = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
    const { id } = await params;
    return { title: `Заказ #${id} — ${APP_NAME}` };
}

export default async function MasterOrderDetailRoute({ params }: TProps) {
    const { id } = await params;
    return <MasterOrderDetailPage orderId={Number(id)} />;
}
