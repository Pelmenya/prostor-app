import { AddressDetailPage } from '@/views/addresses';

type TProps = {
    params: Promise<{ id: string }>;
};

export default async function RealEstateDetailRoute({ params }: TProps) {
    const { id } = await params;
    return <AddressDetailPage id={Number(id)} />;
}
