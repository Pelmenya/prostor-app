import { ConfirmDialog } from '@/shared/ui';
import type { TStatusTransition } from '@/entities/order';

type TMasterOrderActionsProps = {
    action: TStatusTransition;
    isOpen: boolean;
    isBusy: boolean;
    error: string | null;
    onOpen: () => void;
    onClose: () => void;
    onConfirm: () => void;
};

export function MasterOrderActions({
    action,
    isOpen,
    isBusy,
    error,
    onOpen,
    onClose,
    onConfirm,
}: TMasterOrderActionsProps) {
    return (
        <>
            <button
                type="button"
                className="btn btn-primary w-full"
                onClick={onOpen}
                disabled={isBusy}
            >
                {action.label}
            </button>

            <ConfirmDialog
                isOpen={isOpen}
                onClose={onClose}
                onConfirm={onConfirm}
                title={action.label}
                message={error ?? action.confirm}
                confirmText="Подтвердить"
                cancelText="Отмена"
                isBusy={isBusy}
            />
        </>
    );
}
