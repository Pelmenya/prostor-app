'use client';

import { ShoppingCartIcon } from '@heroicons/react/20/solid';
import { Counter } from '@/shared/ui/counter';
import type { TProductTabType } from '@/shared/ui/product-tab-switcher';
import type { TProduct, TService, TSalePrice } from '@/entities/product';
import type { TCartItem } from '@/entities/cart';
import { ServicesList } from '../service-list';
import { getSalePrices } from '../../lib/get-sale-prices';

type TProductTabContentProps = {
    activeTab: TProductTabType;
    product: TProduct;
    cartItem: TCartItem | undefined;
    isVisible: boolean | string | number | undefined;
    filteredServices: {
        installation: TService[];
        service: TService[];
    };
    onProductIncrement: () => void;
    onProductDecrement: () => void;
    onServiceIncrement: (serviceId: string) => void;
    onServiceDecrement: (serviceId: string) => void;
    onCheckboxChange: (serviceId: string, rateOfHours: number, price?: number) => void;
};

function PricesList({ salePrices, size = 'lg' }: { salePrices: TSalePrice[]; size?: string }) {
    const sizeMap: Record<string, string> = {
        sm: 'text-sm',
        lg: 'text-lg',
        '3xl': 'text-3xl',
    };

    return (
        <ul>
            {salePrices.map((price) => (
                <li key={price.priceType.id} className="flex items-center gap-2">
                    <p
                        className={`${sizeMap[size] || 'text-lg'} font-semibold tracking-tight text-primary`}
                    >
                        {(price.value / 100).toLocaleString('ru-RU')} ₽
                    </p>
                </li>
            ))}
        </ul>
    );
}

export function ProductTabContent({
    activeTab,
    product,
    cartItem,
    isVisible,
    filteredServices,
    onProductIncrement,
    onProductDecrement,
    onServiceIncrement,
    onServiceDecrement,
    onCheckboxChange,
}: TProductTabContentProps) {
    return (
        <div className="bg-base-200 border border-base-300 rounded-2xl p-4">
            {/* Купить */}
            {activeTab === 'buy' && isVisible && (
                <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between gap-4 lg:justify-end">
                        <PricesList salePrices={getSalePrices(product?.salePrices)} />

                        {(cartItem?.count || 0) === 0 ? (
                            <button className="btn btn-primary" onClick={onProductIncrement}>
                                <ShoppingCartIcon className="size-3.5" />
                                <span>В корзину</span>
                            </button>
                        ) : (
                            <Counter
                                count={cartItem?.count || 0}
                                onIncrement={onProductIncrement}
                                onDecrement={onProductDecrement}
                                minCount={0}
                                size="normal"
                            />
                        )}
                    </div>

                    {product.description && (
                        <div className="flex flex-col gap-4 font-medium">
                            <h2 className="leading-[110%]">О товаре</h2>
                            <p className="text-sm leading-[120%] opacity-70">
                                {product.description}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Монтаж */}
            {activeTab === 'installation' && filteredServices.installation.length > 0 && (
                <ServicesList
                    services={filteredServices.installation}
                    serviceStates={cartItem?.services || {}}
                    onIncrement={onServiceIncrement}
                    onDecrement={onServiceDecrement}
                    onCheckboxChange={onCheckboxChange}
                />
            )}

            {/* Сервис */}
            {activeTab === 'service' && filteredServices.service.length > 0 && (
                <ServicesList
                    services={filteredServices.service}
                    serviceStates={cartItem?.services || {}}
                    onIncrement={onServiceIncrement}
                    onDecrement={onServiceDecrement}
                    onCheckboxChange={onCheckboxChange}
                />
            )}
        </div>
    );
}
