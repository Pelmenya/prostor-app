'use client';

import type { TCartServiceItem } from '@/entities/cart';
import { CartServiceItem } from '@/entities/cart';
import { CartCardWrapper } from '@/shared/ui';
import type { TCardBadgeVariant } from '@/shared/ui';

type TCartServiceCardVariant = Exclude<TCardBadgeVariant, 'product'>;

type TCartServiceCardProps = {
    variant: TCartServiceCardVariant;
    productName: string;
    productId: string;
    services: [string, TCartServiceItem][];
    onToggleSelected: (productId: string, serviceId: string) => void;
    onUpdateCount: (productId: string, serviceId: string, count: number) => void;
    onRemove: (productId: string, serviceId: string) => void;
};

export function CartServiceCard({
    variant,
    productName,
    productId,
    services,
    onToggleSelected,
    onUpdateCount,
    onRemove,
}: TCartServiceCardProps) {
    return (
        <CartCardWrapper variant={variant} subtitle={`Для товара: ${productName}`}>
            {services.map(([svcId, svc], idx) => (
                <CartServiceItem
                    key={svcId}
                    service={svc}
                    productId={productId}
                    isLast={idx === services.length - 1}
                    onToggleSelected={onToggleSelected}
                    onUpdateCount={onUpdateCount}
                    onRemove={onRemove}
                />
            ))}
        </CartCardWrapper>
    );
}
