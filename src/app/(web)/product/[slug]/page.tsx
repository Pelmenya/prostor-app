import { ProductPage } from '@/views/product';

type TProductRouteProps = {
    params: Promise<{ slug: string }>;
};

export default async function ProductRoute({ params }: TProductRouteProps) {
    const { slug } = await params;
    return <ProductPage slug={slug} />;
}
