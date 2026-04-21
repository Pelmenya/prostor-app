import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OrderFeedbackClient } from './order-feedback-client';

type TPageProps = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: TPageProps): Promise<Metadata> {
    const { id } = await params;
    return {
        title: `Отзыв о заказе #${id} — PROSTOR`,
    };
}

export default async function OrderFeedbackRoute({ params }: TPageProps) {
    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isFinite(orderId) || orderId <= 0) notFound();

    return <OrderFeedbackClient orderId={orderId} />;
}
