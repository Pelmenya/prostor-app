'use client';

import { useEffect } from 'react';
import { MapPinIcon as MapPinIconSolid } from '@heroicons/react/24/solid';
import { MapPinIcon as MapPinIconOutline } from '@heroicons/react/24/outline';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { useNearestRetailStores } from '@/entities/real-estate';
import type { TRetailStoreWithRouteInfo } from '@/shared/model';

const NEAREST_STORES_LIMIT = 10;

type TPickupStoreSelectorProps = {
    realEstateId: number;
    selectedStoreId?: string | null;
    onSelect: (store: TRetailStoreWithRouteInfo) => void;
    onHasStoresChange?: (hasStores: boolean) => void;
    cartItems: { productId: string; count: number }[];
};

export function PickupStoreSelector({
    realEstateId,
    selectedStoreId,
    onSelect,
    onHasStoresChange,
    cartItems,
}: TPickupStoreSelectorProps) {
    const {
        data: stores,
        isLoading,
        error,
    } = useNearestRetailStores({
        realEstateId,
        limit: NEAREST_STORES_LIMIT,
        cartItems: cartItems.length > 0 ? cartItems : undefined,
    });

    const filteredStores = (stores ?? []).filter((s) => s.availability === 'full');

    useEffect(() => {
        if (isLoading || error) return;
        onHasStoresChange?.(filteredStores.length > 0);
    }, [filteredStores.length, isLoading, error, onHasStoresChange]);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm p-4">
                <span className="loading loading-spinner loading-sm" />
                Загрузка точек самовывоза...
            </div>
        );
    }

    if (error) {
        return <p className="text-error text-sm p-4">Не удалось загрузить точки самовывоза.</p>;
    }

    if (filteredStores.length === 0) {
        return (
            <p className="text-sm opacity-60 p-4">
                Нет доступных точек самовывоза для выбранного адреса.
            </p>
        );
    }

    const isSingle = filteredStores.length <= 1;

    return (
        <div className="w-full">
            <Swiper
                key={`swiper-${filteredStores.length}`}
                spaceBetween={16}
                slidesPerView={isSingle ? 1 : 1.3}
                breakpoints={{
                    576: { slidesPerView: isSingle ? 1 : 1.9 },
                    768: { slidesPerView: isSingle ? 1 : 2.5 },
                    992: { slidesPerView: isSingle ? 1 : 3 },
                }}
                style={{ display: 'grid' }}
            >
                {filteredStores.map((store) => {
                    const isSelected = selectedStoreId === store.id;
                    const distanceKm = (store.distance / 1000).toFixed(1);
                    const durationMin = Math.round(store.duration / 60);

                    return (
                        <SwiperSlide key={store.id} className="flex justify-center">
                            <button
                                type="button"
                                onClick={() => onSelect(store)}
                                className={`w-full h-full flex items-center gap-2 rounded-2xl p-4 text-left transition-colors bg-base-100 border-2 ${
                                    isSelected ? 'border-primary' : 'border-base-content/20'
                                }`}
                            >
                                {isSelected ? (
                                    <MapPinIconSolid className="size-6 shrink-0 text-primary" />
                                ) : (
                                    <MapPinIconOutline className="size-6 shrink-0" />
                                )}
                                <div className="divider divider-horizontal m-0 shrink-0 self-stretch" />
                                <div className="flex flex-col gap-2 flex-1 min-w-0">
                                    <span className="font-semibold text-sm truncate">
                                        {store.name}
                                    </span>
                                    <span className="text-sm line-clamp-3">{store.address}</span>
                                    <div className="flex gap-1 text-sm">
                                        <span>{distanceKm} км</span>
                                        <span>~{durationMin} мин</span>
                                    </div>
                                </div>
                            </button>
                        </SwiperSlide>
                    );
                })}
            </Swiper>
        </div>
    );
}
