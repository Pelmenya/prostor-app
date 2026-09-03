'use client';

import type { TCartItem, TCartServiceItem } from '@/entities/cart';
import { CartItem, CartServiceCard } from '@/entities/cart';
import { EServiceCategory } from '@/shared/model';

type TCartItemListProps = {
    items: Record<string, TCartItem>;
    imageUrls?: Record<string, string | undefined>;
    imageLoadingIds?: Set<string>;
    onToggleProduct: (productId: string) => void;
    onToggleService: (productId: string, serviceId: string) => void;
    onUpdateProductCount: (productId: string, count: number) => void;
    onUpdateServiceCount: (productId: string, serviceId: string, count: number) => void;
    onRemoveProduct: (productId: string, productName: string) => void;
    onRemoveService: (productId: string, serviceId: string) => void;
};

type TServiceGroup = {
    variant: 'installation' | 'maintenance' | 'service';
    productId: string;
    productName: string;
    services: [string, TCartServiceItem][];
};

function getVariant(category?: EServiceCategory): 'installation' | 'maintenance' | 'service' {
    if (category === EServiceCategory.MONTAZH) return 'installation';
    if (category === EServiceCategory.SERVISNOE_OBSLUZHIVANIE) return 'maintenance';
    return 'service';
}

function groupServicesByCategory(entries: [string, TCartItem][]): TServiceGroup[] {
    const groups: TServiceGroup[] = [];

    for (const [productId, item] of entries) {
        const activeServices = Object.entries(item.services).filter(
            ([, svc]) => svc.checked && svc.count > 0,
        );
        if (activeServices.length === 0) continue;

        const byVariant = new Map<string, [string, TCartServiceItem][]>();

        for (const [svcId, svc] of activeServices) {
            const variant = getVariant(svc.serviceInfo.category);
            const list = byVariant.get(variant) ?? [];
            list.push([svcId, svc]);
            byVariant.set(variant, list);
        }

        for (const [variant, services] of byVariant) {
            groups.push({
                variant: variant as TServiceGroup['variant'],
                productId,
                productName: item.product.name,
                services,
            });
        }
    }

    return groups;
}

export function CartItemList({
    items,
    imageUrls,
    imageLoadingIds,
    onToggleProduct,
    onToggleService,
    onUpdateProductCount,
    onUpdateServiceCount,
    onRemoveProduct,
    onRemoveService,
}: TCartItemListProps) {
    const entries = Object.entries(items);
    const productsWithItems = entries.filter(([, item]) => item.count > 0);
    const serviceGroups = groupServicesByCategory(entries);

    return (
        <div className="flex flex-col gap-4 lg:gap-6">
            {productsWithItems.map(([productId, item]) => (
                <CartItem
                    key={productId}
                    item={item}
                    imageUrl={imageUrls?.[productId]}
                    isImageLoading={imageLoadingIds?.has(productId)}
                    onToggleSelected={onToggleProduct}
                    onUpdateCount={onUpdateProductCount}
                    onRemove={onRemoveProduct}
                />
            ))}

            {serviceGroups.map((group) => (
                <CartServiceCard
                    key={`${group.variant}-${group.productId}`}
                    variant={group.variant}
                    productName={group.productName}
                    productId={group.productId}
                    services={group.services}
                    onToggleSelected={onToggleService}
                    onUpdateCount={onUpdateServiceCount}
                    onRemove={onRemoveService}
                />
            ))}
        </div>
    );
}
