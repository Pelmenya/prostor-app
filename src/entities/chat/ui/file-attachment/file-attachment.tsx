'use client';

import { useMemo } from 'react';
import { DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { getStorageUrl } from '../../lib/get-storage-url';
import type { TMessageAttachment } from '../../model/t-message-attachment';

type TProps = {
    attachment: TMessageAttachment;
};

export function FileAttachment({ attachment }: TProps) {
    const fileUrl = getStorageUrl(attachment.path);

    const fileSize = useMemo(() => {
        const bytes = attachment.size;
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }, [attachment.size]);

    return (
        <div
            className="flex items-center gap-3 p-3 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300 transition-colors max-w-xs"
            onClick={() => window.open(fileUrl, '_blank')}
        >
            <DocumentTextIcon className="size-8 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                    {attachment.originalFilename ?? attachment.filename}
                </div>
                <div className="text-xs text-base-content/60">{fileSize}</div>
            </div>
            <ArrowDownTrayIcon className="size-5 text-base-content/60 shrink-0" />
        </div>
    );
}
