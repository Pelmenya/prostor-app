import { ProductPage } from '@/views/product';

type TProductRouteProps = {
    params: Promise<{ id: string }>;
};

export default async function ProductRoute({ params }: TProductRouteProps) {
    const { id } = await params;
    return <ProductPage productId={id} />;
}
