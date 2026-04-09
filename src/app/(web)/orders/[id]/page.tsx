import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OrderDetailClient } from './order-detail-client';

type TPageProps = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: TPageProps): Promise<Metadata> {
    const { id } = await params;
    return {
        title: `Заказ #${id} — PROSTOR`,
    };
}

export default async function OrderDetailRoute({ params }: TPageProps) {
    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isFinite(orderId) || orderId <= 0) notFound();

    return <OrderDetailClient orderId={orderId} />;
}
