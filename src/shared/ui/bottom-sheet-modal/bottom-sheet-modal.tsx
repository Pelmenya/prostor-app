'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';

type TBottomSheetModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    className?: string;
};

export function BottomSheetModal({
    isOpen,
    onClose,
    title,
    children,
    className,
}: TBottomSheetModalProps) {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/40 transition duration-200 ease-out data-closed:opacity-0"
            />
            <div className="fixed inset-0 flex items-end sm:items-center sm:justify-center sm:p-4">
                <DialogPanel
                    transition
                    className={`flex flex-col gap-4 w-full bg-base-100 p-4 rounded-t-2xl transition duration-200 ease-out data-closed:translate-y-full sm:max-w-md sm:rounded-2xl sm:data-closed:translate-y-0 sm:data-closed:scale-95 sm:data-closed:opacity-0 ${className ?? ''}`}
                >
                    {title !== undefined && (
                        <div className="flex items-center justify-between">
                            <DialogTitle as="h3" className="font-bold text-lg leading-6">
                                {title}
                            </DialogTitle>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm btn-square -mr-1"
                                aria-label="Закрыть"
                                onClick={onClose}
                            >
                                <XMarkIcon className="size-5" />
                            </button>
                        </div>
                    )}
                    {children}
                </DialogPanel>
            </div>
        </Dialog>
    );
}
