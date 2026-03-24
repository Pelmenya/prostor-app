'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';

export type TConfirmDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
};

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Подтвердить',
    cancelText = 'Отмена',
}: TConfirmDialogProps) {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/40 transition duration-200 ease-out data-closed:opacity-0"
            />

            <div className="fixed inset-0 flex items-end sm:items-center sm:justify-center sm:p-4">
                <DialogPanel
                    transition
                    className="flex flex-col gap-4 w-full bg-base-100 p-6 rounded-t-2xl rounded-b-none transition duration-200 ease-out data-closed:translate-y-full sm:max-w-md sm:rounded-2xl sm:data-closed:translate-y-0 sm:data-closed:scale-95 sm:data-closed:opacity-0"
                >
                    <DialogTitle as="h3" className="font-bold text-lg">
                        {title}
                    </DialogTitle>

                    <p>{message}</p>

                    <div className="flex gap-6 p-4">
                        <button
                            type="button"
                            className="btn btn-md btn-primary flex-1"
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </button>
                        <button
                            type="button"
                            className="btn btn-md btn-primary btn-soft flex-1"
                            onClick={onClose}
                        >
                            {cancelText}
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
