'use client';

import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';

export type TConfirmDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
};

const VARIANT_BUTTON_CLASS: Record<NonNullable<TConfirmDialogProps['variant']>, string> = {
    danger: 'btn-error',
    warning: 'btn-warning',
    info: 'btn-info',
};

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Подтвердить',
    cancelText = 'Отмена',
    variant = 'danger',
}: TConfirmDialogProps) {
    const confirmBtnClass = VARIANT_BUTTON_CLASS[variant];

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Backdrop */}
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
                </TransitionChild>

                {/* Контейнер позиционирования */}
                <div className="fixed inset-0 flex items-end justify-center sm:items-center">
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        enterTo="opacity-100 translate-y-0 sm:scale-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                        leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    >
                        <DialogPanel className="modal-box w-full rounded-t-2xl rounded-b-none sm:rounded-2xl sm:max-w-md">
                            <DialogTitle as="h3" className="font-bold text-lg">
                                {title}
                            </DialogTitle>

                            <p className="py-4 text-base-content/70 text-sm">{message}</p>

                            <div className="modal-action mt-2 gap-2">
                                <button type="button" className="btn btn-ghost" onClick={onClose}>
                                    {cancelText}
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${confirmBtnClass}`}
                                    onClick={onConfirm}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}
