import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SubCatalogPage } from '@/views/sub-catalog';
import { getQueryClient } from '@/shared/api';
import { fetchSubGroups, fetchProducts, fetchGroupPath, productKeys } from '@/entities/product';

export const revalidate = 300;

type TSubCatalogRouteProps = {
    params: Promise<{ id: string }>;
};

export default async function SubCatalogRoute({ params }: TSubCatalogRouteProps) {
    const { id } = await params;
    const queryClient = getQueryClient();

    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: productKeys.subGroups(id),
            queryFn: () => fetchSubGroups(id),
        }),
        queryClient.prefetchQuery({
            queryKey: productKeys.products(id),
            queryFn: () => fetchProducts(id),
        }),
        queryClient.prefetchQuery({
            queryKey: productKeys.groupPath(id),
            queryFn: () => fetchGroupPath(id),
        }),
    ]);

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <SubCatalogPage groupId={id} />
        </HydrationBoundary>
    );
}
