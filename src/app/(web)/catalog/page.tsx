import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { CatalogPage } from '@/views/catalog';
import { getQueryClient } from '@/shared/api';
import { fetchSubGroups, productKeys } from '@/entities/product';
import { MAIN_CATALOG_ID } from '@/shared/config';

export const revalidate = 300;

export default async function CatalogRoute() {
    const queryClient = getQueryClient();
    await queryClient.prefetchQuery({
        queryKey: productKeys.subGroups(MAIN_CATALOG_ID),
        queryFn: () => fetchSubGroups(MAIN_CATALOG_ID),
    });
    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CatalogPage />
        </HydrationBoundary>
    );
}
