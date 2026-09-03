'use client';

import { DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { getStorageUrl } from '../../lib/get-storage-url';
import type { TMessageAttachment } from '../../model/t-message-attachment';

type TProps = {
    attachment: TMessageAttachment;
};

export function FileAttachment({ attachment }: TProps) {
    const fileUrl = getStorageUrl(attachment.path);

    const bytes = attachment.size;
    const fileSize =
        bytes < 1024
            ? `${bytes} B`
            : bytes < 1024 * 1024
              ? `${(bytes / 1024).toFixed(1)} KB`
              : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

    return (
        <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center gap-3 p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors max-w-xs"
        >
            <DocumentTextIcon className="size-8 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                    {attachment.originalFilename ?? attachment.filename}
                </div>
                <div className="text-xs text-base-content/60">{fileSize}</div>
            </div>
            <ArrowDownTrayIcon className="size-5 text-base-content/60 shrink-0" />
        </a>
    );
}
