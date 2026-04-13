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
    isBusy?: boolean;
};

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Подтвердить',
    cancelText = 'Отмена',
    isBusy = false,
}: TConfirmDialogProps) {
    return (
        <BottomSheetModal isOpen={isOpen} onClose={onClose} title={title}>
            <p>{message}</p>
            <div className="flex gap-6">
                <button
                    type="button"
                    className="btn btn-md btn-primary flex-1"
                    onClick={onConfirm}
                    disabled={isBusy}
                >
                    {confirmText}
                </button>
                <button
                    type="button"
                    className="btn btn-md btn-primary btn-soft flex-1"
                    onClick={onClose}
                    disabled={isBusy}
                >
                    {cancelText}
                </button>
            </div>
        </BottomSheetModal>
    );
}
