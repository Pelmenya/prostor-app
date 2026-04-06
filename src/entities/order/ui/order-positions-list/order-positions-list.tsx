import { CubeIcon } from '@heroicons/react/20/solid';
import { WrenchScrewdriverIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/16/solid';
import type { TCartItem, TCartServiceItem } from '@/shared/model';
import { EServiceCategory as ServiceCategory } from '@/shared/model';
import type { TOrderCartState } from '../../model/types/t-order';
import { getServiceInfo } from '../../lib/get-service-info';
import { useOrderPositionsGrouped } from '../../lib/use-order-positions-grouped';
import { OrderProductCard } from '../order-product-card/order-product-card';
import { OrderServiceCard } from '../order-service-card/order-service-card';

type TOrderPositionsListProps = {
    cartState: TOrderCartState;
    imageUrls?: Record<string, string | undefined>;
    loadingIds?: Set<string>;
};

function ProductsSection({
    items,
    imageUrls,
    loadingIds,
}: {
    items: TCartItem[];
    imageUrls?: Record<string, string | undefined>;
    loadingIds?: Set<string>;
}) {
    const filtered = items.filter((item) => item?.count > 0 && item?.product);
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
                    key={item.product?.id ?? idx}
                    product={item.product}
                    count={item.count}
                    isLast={idx === filtered.length - 1}
                    imageUrl={imageUrls?.[item.product?.id]}
                    isImageLoading={loadingIds?.has(item.product?.id) ?? false}
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
    category: ServiceCategory | undefined;
    label: string;
    icon: React.ReactNode;
}) {
    return (
        <>
            {items.map((it) => {
                const checkedServices = Object.values(it.services || {}).filter(
                    (s: TCartServiceItem) => {
                        const serviceCategory = getServiceInfo(s)?.category as ServiceCategory | undefined;
                        return (
                            s?.checked &&
                            s?.count > 0 &&
                            (category === undefined
                                ? serviceCategory === undefined
                                : serviceCategory === category)
                        );
                    },
                );

                if (checkedServices.length === 0) return null;

                return (
                    <div
                        key={`${it.product?.id}-${label}`}
                        className="relative border border-base-300 rounded-2xl p-4 flex flex-col gap-3"
                    >
                        <span className="badge badge-sm border-base-300 absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                            <span className="flex items-center gap-2 font-semibold leading-6">
                                {icon}
                                {label}
                            </span>
                        </span>
                        <p className="text-xs text-base-content/60 line-clamp-1">
                            {it.product?.name}
                        </p>
                        {checkedServices.map((serviceItem, idx) => (
                            <OrderServiceCard
                                key={getServiceInfo(serviceItem)?.id ?? idx}
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

export function OrderPositionsList({ cartState, imageUrls, loadingIds }: TOrderPositionsListProps) {
    const { items, hasProducts, hasInstallation, hasMaintenance, hasGeneral } =
        useOrderPositionsGrouped(cartState);

    if (!items.length) return null;

    return (
        <div className="flex flex-col w-full gap-6">
            {hasProducts && (
                <ProductsSection items={items} imageUrls={imageUrls} loadingIds={loadingIds} />
            )}

            {hasInstallation && (
                <ServicesSection
                    items={items}
                    category={ServiceCategory.MONTAZH}
                    label="Монтаж"
                    icon={<WrenchScrewdriverIcon className="size-3" />}
                />
            )}

            {hasMaintenance && (
                <ServicesSection
                    items={items}
                    category={ServiceCategory.SERVISNOE_OBSLUZHIVANIE}
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
