'use client';

import type { TCartItem } from '@/entities/cart';
import { CartItem } from '@/entities/cart/ui/cart-item';
import { CartServiceItem } from '@/entities/cart/ui/cart-service-item';

type TCartItemListProps = {
    items: Record<string, TCartItem>;
    onToggleProduct: (productId: string) => void;
    onToggleService: (productId: string, serviceId: string) => void;
    onUpdateProductCount: (productId: string, count: number) => void;
    onUpdateServiceCount: (productId: string, serviceId: string, count: number) => void;
    onRemoveProduct: (productId: string, productName: string) => void;
    onRemoveService: (productId: string, serviceId: string) => void;
};

export function CartItemList({
    items,
    onToggleProduct,
    onToggleService,
    onUpdateProductCount,
    onUpdateServiceCount,
    onRemoveProduct,
    onRemoveService,
}: TCartItemListProps) {
    const entries = Object.entries(items);

    return (
        <div className="flex flex-col gap-4 lg:gap-6">
            {entries.map(([productId, item]) => {
                const activeServices = Object.entries(item.services).filter(
                    ([, svc]) => svc.checked && svc.count > 0,
                );

                return (
                    <div key={productId} className="flex flex-col gap-4">
                        {item.count > 0 && (
                            <CartItem
                                item={item}
                                onToggleSelected={onToggleProduct}
                                onUpdateCount={onUpdateProductCount}
                                onRemove={onRemoveProduct}
                            />
                        )}

                        {activeServices.length > 0 && (
                            <div className="card bg-base-100 p-4">
                                <p className="mb-2 text-xs font-medium text-base-content/50">
                                    Услуги к «{item.product.name}»
                                </p>
                                {activeServices.map(([svcId, svc], idx) => (
                                    <CartServiceItem
                                        key={svcId}
                                        service={svc}
                                        productId={productId}
                                        isLast={idx === activeServices.length - 1}
                                        onToggleSelected={onToggleService}
                                        onUpdateCount={onUpdateServiceCount}
                                        onRemove={onRemoveService}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
