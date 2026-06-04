import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { notFound } from 'next/navigation';
import { MasterOrderChatPage } from '@/views/dashboard/master-order-chat';

type TPageProps = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: TPageProps): Promise<Metadata> {
    const { id } = await params;
    return { title: `Чат заказа #${id} — ${APP_NAME}` };
}

export default async function MasterOrderChatRoute({ params }: TPageProps) {
    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isFinite(orderId) || orderId <= 0) notFound();

    return <MasterOrderChatPage orderId={orderId} />;
}
