'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import type { TLegalDocument } from '@/shared/model';

// SECURITY: НЕ добавлять rehype-raw — контент с бэкенда, возможен XSS
const ALLOWED_ELEMENTS = ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a'];

function MdH1(props: React.ComponentProps<'h1'>) {
    return <h1 className="text-lg font-bold mb-4 text-primary" {...props} />;
}
function MdH2(props: React.ComponentProps<'h2'>) {
    return <h2 className="text-base font-semibold mt-6 mb-3 text-primary" {...props} />;
}
function MdH3(props: React.ComponentProps<'h3'>) {
    return <h3 className="text-sm font-semibold mt-4 mb-2" {...props} />;
}
function MdP(props: React.ComponentProps<'p'>) {
    return <p className="mb-3 leading-relaxed text-sm" {...props} />;
}
function MdUl(props: React.ComponentProps<'ul'>) {
    return <ul className="list-disc ml-4 mb-3 space-y-2" {...props} />;
}
function MdOl(props: React.ComponentProps<'ol'>) {
    return <ol className="list-decimal ml-4 mb-3 space-y-2" {...props} />;
}
function MdLi(props: React.ComponentProps<'li'>) {
    return <li className="mb-1 text-sm leading-relaxed" {...props} />;
}
function MdStrong(props: React.ComponentProps<'strong'>) {
    return <strong className="font-semibold text-primary" {...props} />;
}

const MARKDOWN_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>['components'] = {
    h1: MdH1,
    h2: MdH2,
    h3: MdH3,
    p: MdP,
    ul: MdUl,
    ol: MdOl,
    li: MdLi,
    strong: MdStrong,
};

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
                            <div className="prose prose-sm max-w-none">
                                <ReactMarkdown
                                    allowedElements={ALLOWED_ELEMENTS}
                                    components={MARKDOWN_COMPONENTS}
                                >
                                    {document.content}
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
