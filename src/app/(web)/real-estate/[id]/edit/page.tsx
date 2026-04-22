import { notFound } from 'next/navigation';
import { EditAddressClient } from './real-estate-edit-client';

type TProps = {
    params: Promise<{ id: string }>;
};

export default async function EditRealEstateRoute({ params }: TProps) {
    const { id } = await params;
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) notFound();
    return <EditAddressClient id={id} />;
}
