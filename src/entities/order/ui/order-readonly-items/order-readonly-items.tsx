'use client';

import Link from 'next/link';
import type { TCartItem } from '@/shared/model';
import { EServiceCategory } from '@/shared/model';
import { CartCardWrapper, CardImage } from '@/shared/ui';
import { formatPrice } from '@/shared/lib';
import { getServiceInfo } from '../../lib/get-service-info';

const SERVICE_GROUPS = [
    { category: EServiceCategory.MONTAZH, variant: 'installation' as const },
    { category: EServiceCategory.SERVISNOE_OBSLUZHIVANIE, variant: 'maintenance' as const },
    { category: undefined, variant: 'service' as const },
];

type TOrderReadonlyItemsProps = {
    items: Record<string, TCartItem>;
    imageUrls: Record<string, string | undefined>;
    loadingIds: Set<string>;
};

export function OrderReadonlyItems({ items, imageUrls, loadingIds }: TOrderReadonlyItemsProps) {
    const visibleItems = Object.values(items).filter((item) => item?.product && item.count > 0);

    if (visibleItems.length === 0) return null;

    return (
        <>
            {visibleItems.map((cartItem) => {
                const imgUrl = imageUrls[cartItem.product.id];
                const serviceEntries = Object.entries(cartItem.services ?? {}).filter(
                    ([, s]) => s?.checked && s.count > 0,
                );

                return (
                    <div key={cartItem.product.id} className="flex flex-col gap-4">
                        {/* Товар */}
                        <CartCardWrapper variant="product">
                            {/* Мобилка: 2 строки */}
                            <div className="flex flex-col gap-4 md:hidden">
                                <Link
                                    href={`/product/${cartItem.product.id}`}
                                    className="flex cursor-pointer items-center gap-2"
                                >
                                    <CardImage
                                        src={imgUrl}
                                        isLoading={loadingIds.has(cartItem.product.id)}
                                        className="h-16 w-12 shrink-0 rounded-2xl"
                                        imgClassName="size-full object-contain"
                                        alt={cartItem.product.name}
                                    />
                                    <h5 className="line-clamp-2 text-sm leading-[110%]">
                                        {cartItem.product.name}
                                    </h5>
                                </Link>

                                <hr className="h-px text-base-300" />

                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-primary leading-[110%]">
                                        {formatPrice(cartItem.price)}
                                    </span>
                                    <span className="font-medium leading-[110%]">
                                        x{cartItem.count}
                                    </span>
                                </div>
                            </div>

                            {/* Десктоп: 1 строка */}
                            <div className="hidden md:flex md:items-center md:gap-4">
                                <Link
                                    href={`/product/${cartItem.product.id}`}
                                    className="flex cursor-pointer items-center gap-2 flex-1 min-w-0"
                                >
                                    <CardImage
                                        src={imgUrl}
                                        isLoading={loadingIds.has(cartItem.product.id)}
                                        className="h-16 w-12 shrink-0 rounded-2xl"
                                        imgClassName="size-full object-contain"
                                        alt={cartItem.product.name}
                                    />
                                    <h5 className="line-clamp-2 text-sm leading-[110%]">
                                        {cartItem.product.name}
                                    </h5>
                                </Link>
                                <span className="shrink-0 font-semibold text-primary leading-[110%]">
                                    {formatPrice(cartItem.price)}
                                </span>
                                <span className="font-medium leading-[110%]">
                                    x{cartItem.count}
                                </span>
                            </div>
                        </CartCardWrapper>

                        {/* Услуги к товару, сгруппированные по категории */}
                        {SERVICE_GROUPS.map(({ category, variant }) => {
                            const grouped = serviceEntries.filter(
                                ([, svc]) => getServiceInfo(svc)?.category === category,
                            );
                            if (grouped.length === 0) return null;
                            return (
                                <CartCardWrapper
                                    key={variant}
                                    variant={variant}
                                    subtitle={`Для товара: ${cartItem.product.name}`}
                                >
                                    {grouped.map(([svcId, svc], idx) => {
                                        const info = getServiceInfo(svc);
                                        const isLast = idx === grouped.length - 1;
                                        return (
                                            <div key={svcId}>
                                                {/* Мобилка: 2 строки */}
                                                <div className="flex flex-col gap-2 md:hidden">
                                                    <p className="line-clamp-2 text-sm leading-[110%]">
                                                        {info?.name}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-semibold tracking-tight text-primary leading-[110%]">
                                                            {formatPrice(svc.price)}
                                                        </p>
                                                        <span className="font-medium leading-[110%]">
                                                            x{svc.count}
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* Десктоп: 1 строка */}
                                                <div className="hidden md:flex md:items-center md:gap-4">
                                                    <p className="line-clamp-2 flex-1 min-w-0 text-sm leading-[110%]">
                                                        {info?.name}
                                                    </p>
                                                    <p className="shrink-0 text-sm font-semibold tracking-tight text-primary leading-[110%]">
                                                        {formatPrice(svc.price)}
                                                    </p>
                                                    <span className="font-medium leading-[110%]">
                                                        x{svc.count}
                                                    </span>
                                                </div>
                                                {!isLast && <hr className="h-px text-base-300" />}
                                            </div>
                                        );
                                    })}
                                </CartCardWrapper>
                            );
                        })}
                    </div>
                );
            })}
        </>
    );
}
