'use client';

import { useState } from 'react';
import { getStorageUrl } from '../../lib/get-storage-url';
import type { TMessageAttachment } from '../../model/t-message-attachment';

type TProps = {
    attachment: TMessageAttachment;
    onClick?: () => void;
};

export function ImageAttachment({ attachment, onClick }: TProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const previewUrl = getStorageUrl(attachment.thumbnailPath ?? attachment.path);

    if (hasError) {
        return (
            <div className="w-48 h-48 bg-base-200 rounded-lg flex items-center justify-center">
                <span className="text-base-content/60 text-sm">Ошибка загрузки</span>
            </div>
        );
    }

    return (
        <div
            className="relative cursor-pointer overflow-hidden rounded-lg max-w-xs"
            onClick={onClick}
        >
            {!isLoaded && <div className="absolute inset-0 bg-base-200 animate-pulse rounded-lg" />}
            <img
                src={previewUrl}
                alt={attachment.originalFilename ?? attachment.filename}
                className={`max-w-full h-auto rounded-lg transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    maxHeight: '300px',
                    aspectRatio:
                        attachment.width && attachment.height
                            ? `${attachment.width} / ${attachment.height}`
                            : undefined,
                }}
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
                loading="lazy"
            />
        </div>
    );
}
