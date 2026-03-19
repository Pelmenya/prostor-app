import { SubCatalogPage } from '@/views/sub-catalog';

type TSubCatalogRouteProps = {
    params: Promise<{ id: string }>;
};

export default async function SubCatalogRoute({ params }: TSubCatalogRouteProps) {
    const { id } = await params;
    return <SubCatalogPage groupId={id} />;
}
