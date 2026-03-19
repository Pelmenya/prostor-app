'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import Image from 'next/image';
import { useProductImages, getImageProxyUrl } from '@/entities/product';

import 'swiper/css';
import 'swiper/css/pagination';

type TProductSliderProps = {
    productId: string;
};

export function ProductSlider({ productId }: TProductSliderProps) {
    const { data: images, isLoading } = useProductImages(productId);

    if (isLoading) {
        return (
            <div className="skeleton flex justify-center h-[268px] gradient-bg rounded-none overflow-hidden -mx-4 md:-mx-6 xl:-mx-10 w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] xl:w-[calc(100%+5rem)]" />
        );
    }

    if (!images || images.length === 0) {
        return (
            <div className="flex justify-center items-center h-[268px] gradient-bg-grey rounded-none overflow-hidden -mx-4 md:-mx-6 xl:-mx-10 w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] xl:w-[calc(100%+5rem)]">
                <span className="text-sm text-base-content/40">Нет изображений</span>
            </div>
        );
    }

    return (
        <div className="flex justify-center h-[268px] p-5 gradient-bg overflow-hidden -mx-4 md:-mx-6 xl:-mx-10 w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] xl:w-[calc(100%+5rem)]">
            <Swiper
                modules={[Pagination]}
                spaceBetween={50}
                slidesPerView={1}
                pagination={{ clickable: true }}
            >
                {images.map((image, index) => (
                    <SwiperSlide key={index}>
                        <div className="relative flex justify-center items-center h-[228px]">
                            <Image
                                src={getImageProxyUrl(image.meta.downloadHref)}
                                alt={`Изображение ${index + 1}`}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}
