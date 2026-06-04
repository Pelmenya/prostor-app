import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { notFound } from 'next/navigation';
import { OrderChatPage } from '@/views/order-chat';

type TPageProps = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: TPageProps): Promise<Metadata> {
    const { id } = await params;
    return { title: `Чат по заказу #${id} — ${APP_NAME}` };
}

export default async function OrderChatRoute({ params }: TPageProps) {
    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isFinite(orderId) || orderId <= 0) notFound();

    return <OrderChatPage orderId={orderId} />;
}
