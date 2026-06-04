'use client';

import Image from 'next/image';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export type TUploadFile = {
    id: string;
    file: File;
    progress: number;
    previewUrl?: string;
};

type TProps = {
    file: File;
    progress: number;
    previewUrl?: string;
    onRemove: () => void;
};

export function UploadPreviewItem({ file, progress, previewUrl, onRemove }: TProps) {
    const isImage = file.type.startsWith('image/');
    const isUploading = progress > 0 && progress < 100;
    const isComplete = progress === 100;
    const fileExtension = file.name.split('.').pop()?.toUpperCase();

    const bytes = file.size;
    const fileSize =
        bytes < 1024
            ? `${bytes} B`
            : bytes < 1024 * 1024
              ? `${(bytes / 1024).toFixed(1)} KB`
              : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

    return (
        <div className="relative shrink-0 w-20 h-20">
            <div className="w-full h-full rounded-lg overflow-hidden bg-base-200 border border-base-300">
                {isImage && previewUrl ? (
                    <Image
                        src={previewUrl}
                        alt={file.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-1">
                        <DocumentTextIcon className="size-6 text-base-content/60" />
                        <span className="text-[10px] text-base-content/60 truncate w-full text-center mt-1">
                            {fileExtension}
                        </span>
                    </div>
                )}
            </div>

            {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <span className="loading loading-spinner loading-sm text-primary" />
                </div>
            )}

            {isComplete && (
                <div className="absolute bottom-1 right-1 bg-success text-success-content rounded-full p-0.5">
                    <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
            )}

            {!isUploading && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute -top-1.5 -right-1.5 btn btn-circle btn-xs btn-error"
                >
                    <XMarkIcon className="size-3" />
                </button>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5 rounded-b-lg">
                {fileSize}
            </div>
        </div>
    );
}
