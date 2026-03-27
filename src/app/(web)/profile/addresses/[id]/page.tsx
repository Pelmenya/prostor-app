import { EditAddressPage } from '@/views/addresses';

type TProps = {
    params: Promise<{ id: string }>;
};

export default async function EditAddressRoute({ params }: TProps) {
    const { id } = await params;
    return <EditAddressPage id={id} />;
}
