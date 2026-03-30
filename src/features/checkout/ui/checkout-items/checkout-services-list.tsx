'use client';

import type { TCartItem } from '@/entities/cart';
import { formatPrice } from '@/shared/lib';

type TCheckoutServicesListProps = {
    items: Record<string, TCartItem>;
};

export function CheckoutServicesList({ items }: TCheckoutServicesListProps) {
    const entries = Object.entries(items);
    if (entries.length === 0) return null;

    return (
        <div className="flex flex-col gap-3">
            {entries.map(([productId, item]) => {
                const services = Object.entries(item.services).filter(
                    ([, svc]) => svc.checked && svc.count > 0 && svc.selectedForCheckout,
                );
                if (services.length === 0) return null;

                return (
                    <div
                        key={productId}
                        className="rounded-2xl bg-base-100 p-3 flex flex-col gap-2"
                    >
                        <p className="text-xs opacity-60 line-clamp-1">Для: {item.product.name}</p>
                        {services.map(([svcId, svc]) => (
                            <div key={svcId} className="flex items-center justify-between gap-4">
                                <p className="text-sm line-clamp-2">{svc.serviceInfo.name}</p>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-sm opacity-60">× {svc.count}</span>
                                    <span className="text-sm font-semibold text-primary">
                                        {formatPrice(svc.price * svc.count)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}
