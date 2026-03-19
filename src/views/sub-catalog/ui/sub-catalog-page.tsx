'use client';

import { useSubGroups, useProducts, useGroupPath } from '@/entities/product';
import { GroupList, GroupListSkeleton, ProductList, ProductListSkeleton } from '@/features/catalog';
import { Page } from '@/widgets/page';
import { Header } from '@/widgets/header';
import { Footer } from '@/widgets/footer';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { MAIN_CATALOG_ID } from '@/shared/config';

type TSubCatalogPageProps = {
    groupId: string;
};

export function SubCatalogPage({ groupId }: TSubCatalogPageProps) {
    const { data: categoryPath, isLoading: isLoadingPath } = useGroupPath(groupId);
    const { data: subGroups, isLoading: isLoadingSubGroups } = useSubGroups(groupId);
    const { data: products, isLoading: isLoadingProducts } = useProducts(groupId);

    // Хлебные крошки: убираем всё до MAIN_CATALOG_ID (Аквафор)
    const aquaforIndex = categoryPath
        ? categoryPath.findIndex((item) => item.id === MAIN_CATALOG_ID)
        : -1;
    const filteredPath = aquaforIndex >= 0 ? categoryPath?.slice(aquaforIndex + 1) : categoryPath;

    const breadcrumbs = [
        { name: 'Каталог', path: '/catalog' },
        ...(filteredPath
            ? filteredPath.map((item) => ({
                  name: item.groupName || '',
                  path: `/catalog/${item.id}`,
              }))
            : []),
    ];

    return (
        <Page header={<Header />} footer={<Footer />} className="bg-base-300">
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
        </Page>
    );
}
