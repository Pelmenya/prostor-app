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
    // Используем общий QueryClient (cache() гарантирует один экземпляр на запрос),
    // чтобы fetchGroupPath не выполнялся дважды — здесь и в prefetchQuery ниже.
    const queryClient = getQueryClient();
    const path = await queryClient
        .fetchQuery({
            queryKey: productKeys.groupPath(id),
            queryFn: () => fetchGroupPath(id),
            staleTime: 5 * 60 * 1000,
        })
        .catch(() => null);
    const name = path?.at(-1)?.groupName ?? 'Каталог';
    return {
        title: `${name} — PROSTOR`,
        description: `Товары и услуги в категории «${name}». Монтаж и обслуживание систем водоочистки.`,
    };
}

export default async function SubCatalogRoute({ params }: TSubCatalogRouteProps) {
    const { id } = await params;

    // Полноценная UUID v4 проверка (8-4-4-4-12)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) notFound();
    const queryClient = getQueryClient();

    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: productKeys.subGroups(id),
            queryFn: () => fetchSubGroups(id),
            staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
            queryKey: productKeys.products(id),
            queryFn: () => fetchProducts(id),
            staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
            queryKey: productKeys.groupPath(id),
            queryFn: () => fetchGroupPath(id),
            staleTime: 5 * 60 * 1000,
        }),
    ]);

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <SubCatalogPage groupId={id} />
        </HydrationBoundary>
    );
}
