'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useCurrentAgreement } from '@/entities/personal-data-agreement';

type TProps = {
    isOpen: boolean;
    onClose: () => void;
    onAgree: () => void;
};

export function PersonalDataModal({ isOpen, onClose, onAgree }: TProps) {
    const { data: agreement, isLoading, isError } = useCurrentAgreement();
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
                <h3 className="text-lg font-bold mb-4">
                    Согласие на обработку персональных данных
                </h3>

                <div className="flex-1 overflow-y-auto">
                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <span className="loading loading-spinner loading-lg" />
                        </div>
                    )}
                    {isError && (
                        <div className="alert alert-error">
                            Не удалось загрузить согласие на обработку ПДн
                        </div>
                    )}
                    {agreement && (
                        <>
                            <div className="alert alert-info mb-4">
                                <div className="flex flex-col gap-1">
                                    <span className="font-semibold">
                                        Версия: {agreement.version}
                                    </span>
                                    <span className="text-xs">
                                        Действует с:{' '}
                                        {new Date(agreement.effectiveDate).toLocaleDateString(
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
                            <div className="prose prose-sm max-w-none">
                                <ReactMarkdown
                                    components={{
                                        h1: ({ ...props }) => (
                                            <h1
                                                className="text-lg font-bold mb-4 text-primary"
                                                {...props}
                                            />
                                        ),
                                        h2: ({ ...props }) => (
                                            <h2
                                                className="text-base font-semibold mt-6 mb-3 text-primary"
                                                {...props}
                                            />
                                        ),
                                        h3: ({ ...props }) => (
                                            <h3
                                                className="text-sm font-semibold mt-4 mb-2"
                                                {...props}
                                            />
                                        ),
                                        p: ({ ...props }) => (
                                            <p
                                                className="mb-3 leading-relaxed text-sm"
                                                {...props}
                                            />
                                        ),
                                        ul: ({ ...props }) => (
                                            <ul
                                                className="list-disc ml-4 mb-3 space-y-2"
                                                {...props}
                                            />
                                        ),
                                        ol: ({ ...props }) => (
                                            <ol
                                                className="list-decimal ml-4 mb-3 space-y-2"
                                                {...props}
                                            />
                                        ),
                                        li: ({ ...props }) => (
                                            <li
                                                className="mb-1 text-sm leading-relaxed"
                                                {...props}
                                            />
                                        ),
                                        strong: ({ ...props }) => (
                                            <strong
                                                className="font-semibold text-primary"
                                                {...props}
                                            />
                                        ),
                                    }}
                                >
                                    {agreement.content}
                                </ReactMarkdown>
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-action">
                    <button
                        className="btn btn-primary"
                        onClick={onAgree}
                        disabled={isLoading || isError}
                    >
                        Даю согласие
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
