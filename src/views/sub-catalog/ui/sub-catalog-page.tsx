'use client';

import { useSubGroups, useProducts } from '@/entities/product';
import {
    GroupList,
    GroupListSkeleton,
    ProductList,
    ProductListSkeleton,
    useCatalogBreadcrumbs,
} from '@/features/catalog';
import { PageContainer } from '@/shared/ui/page-container';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';

type TSubCatalogPageProps = {
    groupId: string;
};

export function SubCatalogPage({ groupId }: TSubCatalogPageProps) {
    const { breadcrumbs, isLoading: isLoadingPath } = useCatalogBreadcrumbs(groupId);
    const { data: subGroups, isLoading: isLoadingSubGroups } = useSubGroups(groupId);
    const { data: products, isLoading: isLoadingProducts } = useProducts(groupId);

    return (
        <PageContainer>
            <div className="flex flex-col gap-4 lg:gap-6">
                <Breadcrumbs items={breadcrumbs} isLoading={isLoadingPath} />

                {(isLoadingSubGroups || (subGroups && subGroups.length > 0)) && (
                    <>
                        {isLoadingSubGroups ? (
                            <GroupListSkeleton variant={products?.length ? 'compact' : 'default'} />
                        ) : (
                            <GroupList
                                groups={subGroups || []}
                                variant={products?.length ? 'compact' : 'default'}
                            />
                        )}
                    </>
                )}

                {(isLoadingProducts || (products && products.length > 0)) && (
                    <>
                        {isLoadingProducts ? (
                            <ProductListSkeleton />
                        ) : (
                            <ProductList products={products || []} />
                        )}
                    </>
                )}
            </div>
        </PageContainer>
    );
}
