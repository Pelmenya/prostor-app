import { EOrderStatus } from '@/entities/order';
import type { TUser } from '@/shared/model';

type TOrderActionsProps = {
    status: EOrderStatus;
    executor: Pick<TUser, 'first_name' | 'last_name'> | null | undefined;
    isCancelled: boolean;
    isCancelling: boolean;
    onCancelClick: () => void;
};

export function OrderActions({
    status,
    executor,
    isCancelled,
    isCancelling,
    onCancelClick,
}: TOrderActionsProps) {
    if (status === EOrderStatus.COMPLETED) {
        if (!executor) return null;
        return (
            <div className="flex gap-4">
                <button type="button" disabled className="flex-1 btn btn-md btn-primary">
                    Оценить мастера
                </button>
            </div>
        );
    }

    return (
        <div className="flex gap-4">
            <button type="button" disabled className="flex-1 btn btn-md btn-primary">
                Задать вопрос
            </button>
            <button
                type="button"
                className="flex-1 btn btn-md btn-error btn-outline"
                disabled={isCancelled || isCancelling}
                onClick={onCancelClick}
            >
                Отменить
            </button>
        </div>
    );
}
