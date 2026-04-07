'use client';

import { BottomSheetModal } from '../bottom-sheet-modal';

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
        <BottomSheetModal isOpen={isOpen} onClose={onClose} title={title}>
            <p>{message}</p>
            <div className="flex gap-6 p-4">
                <button type="button" className="btn btn-md btn-primary flex-1" onClick={onConfirm}>
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
        </BottomSheetModal>
    );
}
