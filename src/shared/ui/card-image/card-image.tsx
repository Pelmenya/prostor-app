'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/shared/lib/cn';

type TCardImageProps = {
    src?: string | null;
    alt?: string;
    isLoading?: boolean;
    className?: string;
    imgClassName?: string;
};

export function CardImage({
    src,
    alt = 'Изображение товара',
    isLoading = false,
    className,
    imgClassName = 'object-contain',
}: TCardImageProps) {
    const [isImgLoaded, setIsImgLoaded] = useState(false);
    const [isError, setIsError] = useState(false);

    const showSkeleton = isLoading || (!isImgLoaded && !isError && !!src);
    const showPlaceholder = !isLoading && (!src || isError) && !showSkeleton;

    return (
        <figure
            className={cn(
                'relative bg-base-300 flex items-center justify-center rounded-xl shrink-0 overflow-hidden',
                className,
            )}
        >
            {showSkeleton && <div className="skeleton size-full" />}

            {!isLoading && src && !isError && (
                <Image
                    className={cn(
                        imgClassName,
                        'transition-opacity duration-300',
                        isImgLoaded ? 'opacity-100' : 'opacity-0',
                    )}
                    src={src}
                    alt={alt}
                    fill
                    sizes="(max-width: 768px) 80px, 106px"
                    onLoad={() => setIsImgLoaded(true)}
                    onError={() => setIsError(true)}
                />
            )}

            {showPlaceholder && (
                <div className="text-xs text-base-content/40 text-center px-2">Нет изображения</div>
            )}
        </figure>
    );
}
