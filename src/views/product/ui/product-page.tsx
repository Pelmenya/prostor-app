'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProduct, EServiceCategory } from '@/entities/product';
import {
    ProductSlider,
    ProductTabContent,
    ProductTotal,
    useCartActions,
    useCatalogBreadcrumbs,
} from '@/features/catalog';
import { PageContainer } from '@/shared/ui/page-container';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { ProductTabSwitcher, type TProductTabType } from '@/shared/ui/product-tab-switcher';

type TProductPageProps = {
    productId: string;
};

export function ProductPage({ productId }: TProductPageProps) {
    const { data: product, isLoading, isFetching, error } = useProduct(productId);
    const [activeTab, setActiveTab] = useState<TProductTabType>('buy');

    // Корзина (логика вынесена в хук)
    const {
        cartItem,
        hasCartItems,
        handleProductIncrement,
        handleProductDecrement,
        handleServiceIncrement,
        handleServiceDecrement,
        handleCheckboxChange,
    } = useCartActions(product, productId);

    // Хлебные крошки (через общий хук)
    const lastGroupId = product?.groupPath?.[product.groupPath.length - 1]?.id ?? '';
    const { breadcrumbs, isLoading: isLoadingPath } = useCatalogBreadcrumbs(
        lastGroupId,
        product?.name,
    );

    // Видимость товара
    const isVisible = product?.attributes?.find(
        (attr) => attr.name === 'Видимость для приложения',
    )?.value;

    // Фильтрация услуг
    const installation =
        product?.services?.filter((s) => s.category === EServiceCategory.MONTAZH) || [];
    const service =
        product?.services?.filter((s) => s.category === EServiceCategory.SERVISNOE_OBSLUZHIVANIE) ||
        [];
    const filteredServices = { installation, service };

    const hasInstallationServices = installation.length > 0;
    const hasServiceServices = service.length > 0;

    // Вычисляем эффективный таб
    const effectiveTab: TProductTabType =
        (activeTab === 'installation' && !hasInstallationServices) ||
        (activeTab === 'service' && !hasServiceServices)
            ? 'buy'
            : activeTab;

    // ---- Ошибка ----
    if (error) {
        return (
            <PageContainer bg="bg-base-100">
                <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-lg mb-4">Этот товар больше недоступен или был удалён.</p>
                    <Link href="/catalog" className="btn btn-primary text-lg font-bold">
                        Перейти в каталог
                    </Link>
                </div>
            </PageContainer>
        );
    }

    // ---- Скелетон ----
    if ((isLoading || isFetching) && (!product || product.id !== productId)) {
        return (
            <PageContainer bg="bg-base-100">
                <div className="flex flex-col gap-4">
                    <div className="skeleton h-4 w-48 mb-4" />
                    <div className="skeleton h-[268px] rounded-none -mx-4 md:-mx-6 xl:-mx-10 w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] xl:w-[calc(100%+5rem)]" />
                    <div className="skeleton h-6 w-3/4 mt-4" />
                    <div className="flex gap-2 mt-4">
                        <div className="skeleton h-10 w-24 rounded-lg" />
                        <div className="skeleton h-10 w-24 rounded-lg" />
                        <div className="skeleton h-10 w-24 rounded-lg" />
                    </div>
                    <div className="flex flex-col gap-3 mt-4">
                        <div className="skeleton h-4 w-full" />
                        <div className="skeleton h-4 w-5/6" />
                        <div className="skeleton h-20 w-full mt-4 rounded-2xl" />
                    </div>
                </div>
            </PageContainer>
        );
    }

    if (!product) return null;

    // ---- Рендер ----
    return (
        <PageContainer bg="bg-base-100">
            <div
                className="flex flex-col justify-between"
                style={
                    hasCartItems
                        ? { paddingBottom: 'calc(4.75rem + env(safe-area-inset-bottom))' }
                        : {}
                }
            >
                <div className="pb-4">
                    <Breadcrumbs items={breadcrumbs} isLoading={isLoadingPath} />
                </div>

                <ProductSlider productId={product.id} />

                <div className="bg-base-100 pt-4 flex flex-col">
                    <h1 className="text-lg leading-[110%] font-medium">{product.name}</h1>

                    <ProductTabSwitcher
                        activeTab={effectiveTab}
                        onTabChange={setActiveTab}
                        hasInstallationServices={hasInstallationServices}
                        hasServiceServices={hasServiceServices}
                    />

                    <div className="mt-4">
                        <ProductTabContent
                            activeTab={effectiveTab}
                            product={product}
                            cartItem={cartItem}
                            isVisible={isVisible}
                            filteredServices={filteredServices}
                            onProductIncrement={handleProductIncrement}
                            onProductDecrement={handleProductDecrement}
                            onServiceIncrement={handleServiceIncrement}
                            onServiceDecrement={handleServiceDecrement}
                            onCheckboxChange={handleCheckboxChange}
                        />
                    </div>
                </div>

                <ProductTotal cartItem={cartItem} />
            </div>
        </PageContainer>
    );
}
