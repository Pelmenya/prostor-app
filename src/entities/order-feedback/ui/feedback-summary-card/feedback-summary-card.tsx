import { PencilIcon } from '@heroicons/react/16/solid';
import type { TParameters } from '../../model/types/t-order-feedback-parameters';
import { FeedbackStarsBlock } from '../feedback-stars-block/feedback-stars-block';

type TFeedbackSummaryCardProps = {
    parameters: TParameters;
    comment?: string | null;
    onEdit?: () => void;
};

export function FeedbackSummaryCard({ parameters, comment, onEdit }: TFeedbackSummaryCardProps) {
    return (
        <div className="bg-base-100 rounded-2xl">
            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-lg">Отзыв</div>
                    {onEdit && (
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm gap-1"
                            onClick={onEdit}
                        >
                            <PencilIcon className="size-4" />
                            Редактировать
                        </button>
                    )}
                </div>
                <FeedbackStarsBlock parameters={parameters} readonly />
                {comment && (
                    <div className="mt-2 p-4 bg-base-200 rounded-xl">
                        <div className="font-semibold mb-1">Комментарий:</div>
                        <div className="text-sm">{comment}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
