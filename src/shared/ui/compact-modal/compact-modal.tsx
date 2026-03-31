'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import type { ReactNode } from 'react';

type TCompactModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    className?: string;
};

export function CompactModal({ isOpen, onClose, title, children, className }: TCompactModalProps) {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/40 transition duration-200 ease-out data-closed:opacity-0"
            />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel
                    transition
                    className={`w-full max-w-md max-h-[94vh] overflow-y-auto bg-base-100 shadow-xl rounded-2xl p-4 md:p-6 transition duration-200 ease-out data-closed:opacity-0 data-closed:scale-95 ${className ?? ''}`}
                >
                    {title && (
                        <DialogTitle as="h3" className="text-lg font-medium leading-6 mb-4">
                            {title}
                        </DialogTitle>
                    )}
                    {children}
                </DialogPanel>
            </div>
        </Dialog>
    );
}
