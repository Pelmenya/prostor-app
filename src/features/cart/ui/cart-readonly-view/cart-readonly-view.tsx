import Link from 'next/link';
import type { TCartItem } from '@/shared/model';
import { CartCardWrapper, CardImage } from '@/shared/ui';
import { formatPrice } from '@/shared/lib';
import { getServiceInfo, getServicesForCategory, SERVICE_GROUPS } from '@/entities/order';

type TCartReadonlyViewProps = {
    items: Record<string, TCartItem>;
    imageUrls: Record<string, string | undefined>;
    loadingIds: Set<string>;
};

function hasActiveServices(cartItem: TCartItem): boolean {
    return SERVICE_GROUPS.some(
        ({ category }) => getServicesForCategory(cartItem, category).length > 0,
    );
}

export function CartReadonlyView({ items, imageUrls, loadingIds }: TCartReadonlyViewProps) {
    const allItems = Object.values(items).filter((item) => item?.product);
    const productItems = allItems.filter((item) => item.count > 0);
    const serviceItems = allItems.filter((item) => hasActiveServices(item));

    if (productItems.length === 0 && serviceItems.length === 0) return null;

    return (
        <>
            {/* Сначала все товары */}
            {productItems.map((cartItem) => {
                const imgUrl = imageUrls[cartItem.product.id];
                return (
                    <CartCardWrapper key={cartItem.product.id} variant="product">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
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
                                <h5 className="line-clamp-2 text-sm leading-110">
                                    {cartItem.product.name}
                                </h5>
                            </Link>

                            <hr className="h-px text-base-300 md:hidden" />

                            <div className="flex items-center justify-between md:contents">
                                <span className="font-semibold text-primary leading-110 md:shrink-0">
                                    {formatPrice(cartItem.price)}
                                </span>
                                <span className="font-medium leading-110">x{cartItem.count}</span>
                            </div>
                        </div>
                    </CartCardWrapper>
                );
            })}

            {/* Затем все услуги по всем товарам, сгруппированные по категории */}
            {serviceItems.map((cartItem) =>
                SERVICE_GROUPS.map(({ category, variant }) => {
                    const grouped = getServicesForCategory(cartItem, category);
                    if (grouped.length === 0) return null;
                    return (
                        <CartCardWrapper
                            key={`${cartItem.product.id}-${variant}`}
                            variant={variant}
                            subtitle={`Для товара: ${cartItem.product.name}`}
                        >
                            {grouped.map(([svcId, svc], idx) => {
                                const info = getServiceInfo(svc);
                                const isLast = idx === grouped.length - 1;
                                return (
                                    <div key={svcId}>
                                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                                            <p className="line-clamp-2 text-sm leading-110 md:flex-1 md:min-w-0">
                                                {info?.name}
                                            </p>
                                            <div className="flex items-center justify-between md:contents">
                                                <p className="text-sm font-semibold tracking-tight text-primary leading-110 md:shrink-0">
                                                    {formatPrice(svc.price)}
                                                </p>
                                                <span className="font-medium leading-110">
                                                    x{svc.count}
                                                </span>
                                            </div>
                                        </div>
                                        {!isLast && <hr className="h-px text-base-300" />}
                                    </div>
                                );
                            })}
                        </CartCardWrapper>
                    );
                }),
            )}
        </>
    );
}
