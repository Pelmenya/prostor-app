import { notFound } from 'next/navigation';
import { AddressDetailClient } from './real-estate-detail-client';

type TProps = {
    params: Promise<{ id: string }>;
};

export default async function RealEstateDetailRoute({ params }: TProps) {
    const { id } = await params;
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) notFound();
    return <AddressDetailClient id={numId} />;
}
