import { SubCatalogPage } from '@/views/sub-catalog';

type TSubCatalogRouteProps = {
    params: Promise<{ slug: string }>;
};

export default async function SubCatalogRoute({ params }: TSubCatalogRouteProps) {
    const { slug } = await params;
    return <SubCatalogPage slug={slug} />;
}
