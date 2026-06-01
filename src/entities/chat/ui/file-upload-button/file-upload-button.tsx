'use client';

import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { PaperClipIcon } from '@heroicons/react/24/outline';
import { validateFileSizes } from '../../lib/validate-file-size';

const DEFAULT_ACCEPT =
    'image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,video/mp4,video/quicktime,audio/*';

type TProps = {
    onFilesSelected: (files: File[]) => void;
    disabled?: boolean;
    accept?: string;
};

export function FileUploadButton({
    onFilesSelected,
    disabled = false,
    accept = DEFAULT_ACCEPT,
}: TProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length > 0) {
            const { validFiles, errors } = validateFileSizes(files);
            errors.forEach((err) => alert(err));
            if (validFiles.length > 0) onFilesSelected(validFiles);
        }
        e.target.value = '';
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple
                onChange={handleChange}
                className="hidden"
                disabled={disabled}
            />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="btn btn-ghost btn-square shrink-0"
                title="Прикрепить файл"
            >
                <PaperClipIcon className="size-5" />
            </button>
        </>
    );
}
