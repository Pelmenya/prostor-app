'use client';

import ReactMarkdown from 'react-markdown';
import { useCurrentPolicy } from '@/entities/privacy-policy';

type TProps = {
    isOpen: boolean;
    onClose: () => void;
    onAgree: () => void;
};

export function PrivacyPolicyModal({ isOpen, onClose, onAgree }: TProps) {
    const { data: policy, isLoading, isError } = useCurrentPolicy();

    if (!isOpen) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-2xl max-h-[80vh] flex flex-col">
                <h3 className="text-lg font-bold mb-4">Политика конфиденциальности</h3>

                <div className="flex-1 overflow-y-auto">
                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <span className="loading loading-spinner loading-lg" />
                        </div>
                    )}
                    {isError && (
                        <div className="alert alert-error">
                            Не удалось загрузить политику конфиденциальности
                        </div>
                    )}
                    {policy && (
                        <>
                            <div className="alert alert-info mb-4">
                                <div className="flex flex-col gap-1">
                                    <span className="font-semibold">Версия: {policy.version}</span>
                                    <span className="text-xs">
                                        Действует с:{' '}
                                        {new Date(policy.effectiveDate).toLocaleDateString(
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
                                    {policy.content}
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
                        Соглашаюсь
                    </button>
                    <button className="btn" onClick={onClose}>
                        Отмена
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose} />
        </dialog>
    );
}
