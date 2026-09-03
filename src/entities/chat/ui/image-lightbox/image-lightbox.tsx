'use client';

import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type TProps = {
    imageUrl: string;
    onClose: () => void;
};

export function ImageLightbox({ imageUrl, onClose }: TProps) {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={onClose}
        >
            <button
                type="button"
                className="absolute top-4 right-4 btn btn-circle btn-sm btn-ghost text-white"
                onClick={onClose}
            >
                <XMarkIcon className="size-5" />
            </button>
            <img
                src={imageUrl}
                alt="Изображение"
                className="max-w-full max-h-full object-contain p-4"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}
