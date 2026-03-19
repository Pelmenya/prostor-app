'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProduct, useGroupPath, EServiceCategory } from '@/entities/product';
import { useCartStore, type TCartItem } from '@/entities/cart';
import { ProductSlider } from '@/features/catalog/ui/product-slider';
import { ProductTabContent } from '@/features/catalog/ui/product-tab-content';
import { ProductTotal } from '@/features/catalog/ui/product-total';
import { Header } from '@/widgets/header';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { ProductTabSwitcher, type TProductTabType } from '@/shared/ui/product-tab-switcher';
import { MAIN_CATALOG_ID } from '@/shared/config';
import { getSalePrices } from '@/features/catalog/lib/get-sale-prices';

type TProductPageProps = {
    productId: string;
};

export function ProductPage({ productId }: TProductPageProps) {
    const { data: product, isLoading, isFetching, error } = useProduct(productId);
    const [activeTab, setActiveTab] = useState<TProductTabType>('buy');

    // Корзина
    const cartItem = useCartStore((s) => s.items[productId]) as TCartItem | undefined;
    const addProduct = useCartStore((s) => s.addProduct);
    const updateProductCount = useCartStore((s) => s.updateProductCount);
    const addService = useCartStore((s) => s.addService);
    const updateServiceCount = useCartStore((s) => s.updateServiceCount);

    // Хлебные крошки
    const lastGroupId = product?.groupPath?.[product.groupPath.length - 1]?.id;
    const { data: categoryPath, isLoading: isLoadingPath } = useGroupPath(lastGroupId ?? '');

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
        ...(product ? [{ name: product.name }] : []),
    ];

    // Видимость товара
    const isVisible = product?.attributes?.find(
        (attr) => attr.name === 'Видимость для приложения',
    )?.value;

    // Цена товара
    const productUnitPrice = getSalePrices(product?.salePrices)[0]?.value ?? 0;

    // Фильтрация услуг
    const installation =
        product?.services?.filter((s) => s.category === EServiceCategory.MONTAZH) || [];
    const service =
        product?.services?.filter((s) => s.category === EServiceCategory.SERVISNOE_OBSLUZHIVANIE) ||
        [];
    const filteredServices = { installation, service };

    const hasInstallationServices = installation.length > 0;
    const hasServiceServices = service.length > 0;

    // Вычисляем эффективный таб (если выбранный недоступен — fallback на 'buy')
    const effectiveTab: TProductTabType =
        (activeTab === 'installation' && !hasInstallationServices) ||
        (activeTab === 'service' && !hasServiceServices)
            ? 'buy'
            : activeTab;

    // Есть ли товары/услуги в корзине
    const hasCartItems =
        cartItem &&
        (cartItem.count > 0 ||
            Object.values(cartItem.services).some((svc) => svc.checked && svc.count > 0));

    // ---- Обработчики ----

    const handleProductIncrement = () => {
        if (!product) return;
        if (!cartItem) {
            addProduct(product, 1, productUnitPrice);
        } else {
            updateProductCount(productId, cartItem.count + 1);
        }
    };

    const handleProductDecrement = () => {
        if (!cartItem) return;
        updateProductCount(productId, Math.max(cartItem.count - 1, 0));
    };

    const handleServiceIncrement = (serviceId: string) => {
        if (!product) return;
        if (!cartItem) addProduct(product, 0, productUnitPrice);
        updateServiceCount(productId, serviceId, (cartItem?.services[serviceId]?.count || 0) + 1);
    };

    const handleServiceDecrement = (serviceId: string) => {
        if (!cartItem) return;
        updateServiceCount(
            productId,
            serviceId,
            Math.max((cartItem.services[serviceId]?.count || 0) - 1, 0),
        );
    };

    const handleCheckboxChange = (serviceId: string, rateOfHours: number, price?: number) => {
        if (!product) return;
        if (!cartItem) addProduct(product, 0, productUnitPrice);

        if (cartItem?.services[serviceId]) {
            const newChecked = !cartItem.services[serviceId].checked;
            updateServiceCount(productId, serviceId, newChecked ? 1 : 0);
        } else {
            const fullService = product.services?.find((s) => s.id === serviceId);
            if (fullService) addService(productId, fullService, 1, price ?? 0);
        }
    };

    // ---- Ошибка ----
    if (error) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex flex-col items-center justify-center p-4">
                    <p className="text-lg mb-4">Этот товар больше недоступен или был удалён.</p>
                    <Link href="/catalog" className="btn btn-primary text-lg font-bold">
                        Перейти в каталог
                    </Link>
                </main>
            </div>
        );
    }

    // ---- Скелетон ----
    if ((isLoading || isFetching) && (!product || product.id !== productId)) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 p-4 md:p-6 xl:p-10">
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
                </main>
            </div>
        );
    }

    if (!product) return null;

    // ---- Рендер ----
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main
                className="flex-1 p-4 md:p-6 xl:p-10"
                style={
                    hasCartItems
                        ? { paddingBottom: 'calc(4.75rem + env(safe-area-inset-bottom))' }
                        : {}
                }
            >
                <div className="flex flex-col justify-between">
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
            </main>
        </div>
    );
}
