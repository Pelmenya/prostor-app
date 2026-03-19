'use client';

import { useSubGroupsBySlug, useProductsBySlug } from '@/entities/product';
import { GroupList, GroupListSkeleton, ProductList, ProductListSkeleton } from '@/features/catalog';
import { Page } from '@/widgets/page';
import { Header } from '@/widgets/header';
import { Footer } from '@/widgets/footer';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
type TSubCatalogPageProps = {
    slug: string;
};

export function SubCatalogPage({ slug }: TSubCatalogPageProps) {
    const { data: subGroups, isLoading: isLoadingSubGroups } = useSubGroupsBySlug(slug);
    const { data: products, isLoading: isLoadingProducts } = useProductsBySlug(slug);

    // TODO: хлебные крошки через slug (нужен эндпоинт group-path по slug)
    const breadcrumbs = [{ name: 'Каталог', path: '/catalog' }];

    return (
        <Page header={<Header />} footer={<Footer />} className="bg-base-300">
            <div className="flex flex-col gap-4 lg:gap-6">
                <Breadcrumbs items={breadcrumbs} isLoading={false} />

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
