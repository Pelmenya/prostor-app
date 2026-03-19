'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';

type TCardImageProps = {
    src?: string | null;
    alt: string;
    aspectRatio?: 'square' | '4/3' | '16/9';
    className?: string;
};

const ASPECT_STYLES: Record<string, string> = {
    square: 'aspect-square',
    '4/3': 'aspect-4/3',
    '16/9': 'aspect-video',
};

export function CardImage({ src, alt, aspectRatio = 'square', className }: TCardImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);

    const showSkeleton = !isLoaded && !isError;
    const showPlaceholder = isError || !src;

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-xl bg-base-200',
                ASPECT_STYLES[aspectRatio],
                className,
            )}
        >
            {showSkeleton && <div className="skeleton absolute inset-0 rounded-xl" />}

            {showPlaceholder ? (
                <div className="flex h-full items-center justify-center text-base-content/30">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                        className="size-10"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                        />
                    </svg>
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    className={cn(
                        'h-full w-full object-cover transition-opacity duration-300',
                        isLoaded ? 'opacity-100' : 'opacity-0',
                    )}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setIsError(true)}
                />
            )}
        </div>
    );
}
