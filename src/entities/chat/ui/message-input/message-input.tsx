'use client';

import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { FileUploadButton } from '../file-upload-button/file-upload-button';
import { UploadPreview } from '../upload-preview/upload-preview';
import type { TUploadFile } from '../upload-preview/upload-preview-item';

type TProps = {
    onSendMessage: (content: string) => void;
    onFilesSelected?: (files: File[]) => void;
    isSending?: boolean;
    disabled?: boolean;
    uploadingFiles?: TUploadFile[];
    onRemoveFile?: (id: string) => void;
    onValidationError?: (errors: string[]) => void;
    hasAttachments?: boolean;
};

export function MessageInput({
    onSendMessage,
    onFilesSelected,
    isSending = false,
    disabled = false,
    uploadingFiles = [],
    onRemoveFile,
    onValidationError,
    hasAttachments = false,
}: TProps) {
    const [content, setContent] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = 'auto';
        const maxHeight = window.innerHeight * 0.5;
        textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    };

    useEffect(() => {
        adjustHeight();
    }, [content]);

    const canSend = (content.trim() || hasAttachments) && !disabled && !isSending;

    const handleSend = () => {
        if (!canSend) return;
        onSendMessage(content.trim());
        setContent('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-base-content/10 bg-base-100">
            {uploadingFiles.length > 0 && onRemoveFile && (
                <UploadPreview files={uploadingFiles} onRemove={onRemoveFile} />
            )}

            <div className="flex gap-2 items-end p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                {onFilesSelected && (
                    <FileUploadButton
                        onFilesSelected={onFilesSelected}
                        disabled={disabled || isSending}
                        onValidationError={onValidationError}
                    />
                )}

                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Сообщение..."
                    className="textarea textarea-bordered flex-1 resize-none min-h-[2.5rem] overflow-y-auto"
                    rows={1}
                    disabled={disabled || isSending}
                    style={{ maxHeight: '50vh' }}
                />

                <button
                    type="button"
                    onClick={handleSend}
                    disabled={!canSend}
                    className="btn btn-primary btn-square shrink-0"
                >
                    {isSending ? (
                        <span className="loading loading-spinner loading-sm" />
                    ) : (
                        <PaperAirplaneIcon className="size-5" />
                    )}
                </button>
            </div>
        </div>
    );
}
