'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getServiceInfo } from '@/entities/order';
import type { TCartItem } from '@/shared/model';
import { formatPrice } from '@/shared/lib';
import { EServiceCategory } from '@/shared/model';
import { BottomSheetModal, CardImage } from '@/shared/ui';
import { WrenchScrewdriverIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/16/solid';

type TServiceGroup = {
    category: EServiceCategory | undefined;
    icon: React.ReactNode;
};

const SERVICE_GROUPS: TServiceGroup[] = [
    {
        category: EServiceCategory.MONTAZH,
        icon: <WrenchScrewdriverIcon className="size-3" />,
    },
    {
        category: EServiceCategory.SERVISNOE_OBSLUZHIVANIE,
        icon: <ArrowPathRoundedSquareIcon className="size-3" />,
    },
];

type TOrderCompactItemsProps = {
    items: TCartItem[];
    imageUrls: Record<string, string | undefined>;
    loadingIds: Set<string>;
};

export function OrderCompactItems({ items, imageUrls, loadingIds }: TOrderCompactItemsProps) {
    const [isOpen, setIsOpen] = useState(false);

    const visibleItems = items.filter((item) => item?.product && item.count > 0);
    if (visibleItems.length === 0) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="relative flex flex-col gap-4 p-4 bg-base-100 border border-base-300 rounded-2xl w-full text-left cursor-pointer"
            >
                <div className="flex gap-3 flex-wrap">
                    {visibleItems.flatMap((cartItem) => {
                        const imgUrl = imageUrls[cartItem.product.id];
                        const isImgLoading = loadingIds.has(cartItem.product.id);
                        const imgProps = {
                            src: imgUrl,
                            isLoading: isImgLoading,
                            className: 'h-16 w-12 rounded-2xl',
                            imgClassName: 'size-full object-contain',
                            alt: cartItem.product.name,
                        };

                        return [
                            <div key={`p-${cartItem.product.id}`} className="relative shrink-0">
                                <CardImage {...imgProps} />
                            </div>,
                            ...SERVICE_GROUPS.filter(({ category }) =>
                                Object.values(cartItem.services ?? {}).some(
                                    (s) =>
                                        s.checked &&
                                        s.count > 0 &&
                                        getServiceInfo(s)?.category === category,
                                ),
                            ).map(({ category, icon }) => (
                                <div
                                    key={`svc-${cartItem.product.id}-${category}`}
                                    className="relative shrink-0"
                                >
                                    <CardImage {...imgProps} />
                                    <div className="absolute -top-1 -right-1 flex items-center justify-center size-4 rounded-full bg-primary text-primary-content">
                                        {icon}
                                    </div>
                                </div>
                            )),
                        ];
                    })}
                </div>
            </button>

            <BottomSheetModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Содержимое заказа"
                className="max-h-[85vh] overflow-y-auto"
            >
                <div className="flex flex-col gap-3">
                    {visibleItems.map((cartItem) => {
                        const imgUrl = imageUrls[cartItem.product.id];
                        const isImgLoading = loadingIds.has(cartItem.product.id);

                        const activeServices = SERVICE_GROUPS.flatMap(({ category }) =>
                            Object.entries(cartItem.services ?? {})
                                .filter(
                                    ([, s]) =>
                                        s.checked &&
                                        s.count > 0 &&
                                        getServiceInfo(s)?.category === category,
                                )
                                .map(([svcId, svc]) => ({ svcId, svc })),
                        );

                        return (
                            <div key={cartItem.product.id} className="flex flex-col gap-3">
                                <Link
                                    href={`/product/${cartItem.product.id}`}
                                    className="flex items-center gap-3"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <CardImage
                                        src={imgUrl}
                                        isLoading={isImgLoading}
                                        className="h-16 w-12 shrink-0 rounded-2xl"
                                        imgClassName="size-full object-contain"
                                        alt={cartItem.product.name}
                                    />
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <p className="text-sm line-clamp-2 leading-[110%]">
                                            {cartItem.product.name}
                                        </p>
                                        <p className="text-sm font-semibold text-primary leading-[110%]">
                                            {formatPrice(cartItem.price)}
                                        </p>
                                    </div>
                                </Link>

                                {activeServices.map(({ svcId, svc }) => {
                                    const info = getServiceInfo(svc);
                                    return (
                                        <Link
                                            key={svcId}
                                            href={`/product/${cartItem.product.id}`}
                                            className="flex items-center gap-3"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <div className="relative shrink-0">
                                                <CardImage
                                                    src={imgUrl}
                                                    isLoading={isImgLoading}
                                                    className="h-16 w-12 rounded-2xl"
                                                    imgClassName="size-full object-contain"
                                                    alt={cartItem.product.name}
                                                />
                                                <div className="absolute -top-1 -right-1 flex items-center justify-center size-4 rounded-full bg-primary text-primary-content">
                                                    {getServiceInfo(svc)?.category ===
                                                    EServiceCategory.MONTAZH ? (
                                                        <WrenchScrewdriverIcon className="size-3" />
                                                    ) : (
                                                        <ArrowPathRoundedSquareIcon className="size-3" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <p className="text-sm line-clamp-2 leading-[110%]">
                                                    {info?.name}
                                                </p>
                                                <p className="text-sm font-semibold text-primary leading-[110%]">
                                                    {formatPrice(svc.price * svc.count)}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </BottomSheetModal>
        </>
    );
}
