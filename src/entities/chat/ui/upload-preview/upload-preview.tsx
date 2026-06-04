'use client';

import { UploadPreviewItem } from './upload-preview-item';
import type { TUploadFile } from './upload-preview-item';

type TProps = {
    files: TUploadFile[];
    onRemove: (id: string) => void;
};

export function UploadPreview({ files, onRemove }: TProps) {
    if (files.length === 0) return null;

    return (
        <div className="flex gap-2 p-2 overflow-x-auto border-t border-base-content/10">
            {files.map((item) => (
                <UploadPreviewItem
                    key={item.id}
                    file={item.file}
                    progress={item.progress}
                    previewUrl={item.previewUrl}
                    onRemove={() => onRemove(item.id)}
                />
            ))}
        </div>
    );
}
