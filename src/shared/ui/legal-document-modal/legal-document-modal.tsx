'use client';

import { useEffect, useRef } from 'react';
import type { TLegalDocument } from '@/shared/model';
import { LegalMarkdown } from '../legal-markdown';

// Для miniapp layout — модалка с юридическим документом
type TProps = {
    isOpen: boolean;
    onClose: () => void;
    onAgree: () => void;
    title: string;
    agreeLabel: string;
    errorMessage: string;
    document: TLegalDocument | undefined;
    isLoading: boolean;
    isError: boolean;
};

export function LegalDocumentModal({
    isOpen,
    onClose,
    onAgree,
    title,
    agreeLabel,
    errorMessage,
    document,
    isLoading,
    isError,
}: TProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen && !dialog.open) {
            dialog.showModal();
        } else if (!isOpen && dialog.open) {
            dialog.close();
        }
    }, [isOpen]);

    // Обработка закрытия по Escape (native dialog)
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleCancel = (e: Event) => {
            e.preventDefault();
            onClose();
        };
        dialog.addEventListener('cancel', handleCancel);
        return () => dialog.removeEventListener('cancel', handleCancel);
    }, [onClose]);

    return (
        <dialog ref={dialogRef} className="modal">
            <div className="modal-box max-w-2xl max-h-[80vh] flex flex-col">
                <h3 className="text-lg font-bold mb-4">{title}</h3>

                <div className="flex-1 overflow-y-auto">
                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <span className="loading loading-spinner loading-lg" />
                        </div>
                    )}
                    {isError && <div className="alert alert-error">{errorMessage}</div>}
                    {document && (
                        <>
                            <div className="alert alert-info mb-4">
                                <div className="flex flex-col gap-1">
                                    <span className="font-semibold">
                                        Версия: {document.version}
                                    </span>
                                    <span className="text-xs">
                                        Действует с:{' '}
                                        {new Date(document.effectiveDate).toLocaleDateString(
                                            'ru-RU',
                                            {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            },
                                        )}
                                    </span>
                                </div>
                            </div>
                            <LegalMarkdown content={document.content} compact />
                        </>
                    )}
                </div>

                <div className="modal-action">
                    <button
                        className="btn btn-primary"
                        onClick={onAgree}
                        disabled={isLoading || isError}
                    >
                        {agreeLabel}
                    </button>
                    <button className="btn" onClick={onClose}>
                        Отмена
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button type="button" onClick={onClose}>
                    close
                </button>
            </form>
        </dialog>
    );
}
