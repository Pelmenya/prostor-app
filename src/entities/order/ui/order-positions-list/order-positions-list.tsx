'use client';

import type { TOrderCartState } from '../../model/types/t-order';
import type { TCartItem, TCartServiceItem } from '@/entities/cart';
import { EServiceCategory } from '@/entities/product';
import { CubeIcon } from '@heroicons/react/20/solid';
import { WrenchScrewdriverIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/16/solid';
import { OrderProductCard } from '../order-product-card/order-product-card';
import { OrderServiceCard } from '../order-service-card/order-service-card';

type TOrderPositionsListProps = {
    cartState: TOrderCartState;
};

function hasCheckedServicesByCategory(
    items: TCartItem[],
    category: EServiceCategory | undefined,
): boolean {
    return items.some((it) =>
        Object.values(it.services || {}).some((s: TCartServiceItem) =>
            s.checked && (category === undefined
                ? s.serviceInfo?.category === undefined
                : s.serviceInfo?.category === category),
        ),
    );
}

function ProductsSection({ items }: { items: TCartItem[] }) {
    const filtered = items.filter((item) => item.count > 0);
    if (!filtered.length) return null;

    return (
        <div className="relative border border-base-300 rounded-2xl p-4 flex flex-col gap-3">
            <span className="badge badge-sm border-base-300 absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                <span className="flex items-center gap-2 font-semibold leading-6">
                    <CubeIcon className="size-3" />
                    Товары
                </span>
            </span>
            {filtered.map((item, idx) => (
                <OrderProductCard
                    key={item.product.id}
                    product={item.product}
                    count={item.count}
                    isLast={idx === filtered.length - 1}
                />
            ))}
        </div>
    );
}

function ServicesSection({
    items,
    category,
    label,
    icon,
}: {
    items: TCartItem[];
    category: EServiceCategory | undefined;
    label: string;
    icon: React.ReactNode;
}) {
    return (
        <>
            {items.map((it) => {
                const checkedServices = Object.values(it.services || {}).filter(
                    (s: TCartServiceItem) =>
                        s.checked &&
                        s.count > 0 &&
                        (category === undefined
                            ? s.serviceInfo?.category === undefined
                            : s.serviceInfo?.category === category),
                );

                if (checkedServices.length === 0) return null;

                return (
                    <div
                        key={`${it.product.id}-${label}`}
                        className="relative border border-base-300 rounded-2xl p-4 flex flex-col gap-3"
                    >
                        <span className="badge badge-sm border-base-300 absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                            <span className="flex items-center gap-2 font-semibold leading-6">
                                {icon}
                                {label}
                            </span>
                        </span>
                        <p className="text-xs text-base-content/60 line-clamp-1">
                            {it.product.name}
                        </p>
                        {checkedServices.map((serviceItem, idx) => (
                            <OrderServiceCard
                                key={serviceItem.serviceInfo.id}
                                service={serviceItem}
                                isLast={idx === checkedServices.length - 1}
                            />
                        ))}
                    </div>
                );
            })}
        </>
    );
}

export function OrderPositionsList({ cartState }: TOrderPositionsListProps) {
    const items: TCartItem[] = Object.values(cartState?.items ?? {});

    if (!items.length) return null;

    const hasInstallation = hasCheckedServicesByCategory(items, EServiceCategory.MONTAZH);
    const hasMaintenance = hasCheckedServicesByCategory(items, EServiceCategory.SERVISNOE_OBSLUZHIVANIE);
    const hasGeneral = hasCheckedServicesByCategory(items, undefined);

    return (
        <div className="flex flex-col w-full gap-6">
            {items.length > 0 && <ProductsSection items={items} />}

            {hasInstallation && (
                <ServicesSection
                    items={items}
                    category={EServiceCategory.MONTAZH}
                    label="Монтаж"
                    icon={<WrenchScrewdriverIcon className="size-3" />}
                />
            )}

            {hasMaintenance && (
                <ServicesSection
                    items={items}
                    category={EServiceCategory.SERVISNOE_OBSLUZHIVANIE}
                    label="Сервис"
                    icon={<ArrowPathRoundedSquareIcon className="size-3" />}
                />
            )}

            {hasGeneral && (
                <ServicesSection
                    items={items}
                    category={undefined}
                    label="Услуги"
                    icon={<WrenchScrewdriverIcon className="size-3" />}
                />
            )}
        </div>
    );
}
