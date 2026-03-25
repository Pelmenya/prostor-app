import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SubCatalogPage } from '@/views/sub-catalog';
import { getQueryClient } from '@/shared/api';
import { fetchSubGroups, fetchProducts, fetchGroupPath, productKeys } from '@/entities/product';

export const revalidate = 300;

type TSubCatalogRouteProps = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: TSubCatalogRouteProps): Promise<Metadata> {
    const { id } = await params;
    const path = await fetchGroupPath(id).catch(() => null);
    const name = path?.at(-1)?.groupName ?? 'Каталог';
    return {
        title: `${name} — PROSTOR`,
        description: `Товары и услуги в категории «${name}». Монтаж и обслуживание систем водоочистки.`,
    };
}

export default async function SubCatalogRoute({ params }: TSubCatalogRouteProps) {
    const { id } = await params;

    if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
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
