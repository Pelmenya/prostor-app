'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';

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
                    className={cn(
                        'flex flex-col w-full max-h-[85dvh] bg-base-100 rounded-t-2xl transition duration-200 ease-out data-closed:translate-y-full sm:max-w-md sm:rounded-2xl sm:data-closed:translate-y-0 sm:data-closed:scale-95 sm:data-closed:opacity-0 overflow-hidden',
                        className,
                    )}
                >
                    {title !== undefined && (
                        <header className="shrink-0 flex items-center justify-between gap-2 p-4 border-b border-base-300">
                            <DialogTitle
                                as="h3"
                                className="font-bold text-lg leading-6 min-w-0 truncate"
                            >
                                {title}
                            </DialogTitle>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm btn-square -mr-1 shrink-0"
                                aria-label="Закрыть"
                                onClick={onClose}
                            >
                                <XMarkIcon className="size-5" />
                            </button>
                        </header>
                    )}
                    <div
                        className="overflow-y-auto overflow-x-hidden overscroll-contain flex flex-col gap-4 p-4 min-w-0"
                        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
                    >
                        {children}
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
