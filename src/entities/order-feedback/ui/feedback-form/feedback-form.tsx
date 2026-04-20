'use client';

import { useState } from 'react';
import { allStarsSelected } from '../../lib/all-stars-selected';
import { FEEDBACK_STRUCTURE } from '../../lib/feedback-structure';
import type { TParameters } from '../../model/types/t-order-feedback-parameters';
import { CommentField } from '../comment-field/comment-field';
import { FeedbackStarsBlock } from '../feedback-stars-block/feedback-stars-block';

type TFeedbackFormProps = {
    isSubmitting: boolean;
    onSubmit: (params: { parameters: TParameters; comment: string }) => void;
    initialParameters?: TParameters;
    initialComment?: string;
    submitLabel?: string;
    onCancel?: () => void;
};

export function FeedbackForm({
    isSubmitting,
    onSubmit,
    initialParameters,
    initialComment,
    submitLabel,
    onCancel,
}: TFeedbackFormProps) {
    const [parameters, setParameters] = useState<TParameters>(initialParameters ?? {});
    const [comment, setComment] = useState(initialComment ?? '');
    const [wasTried, setWasTried] = useState(false);

    const notAllStars = !allStarsSelected(parameters, FEEDBACK_STRUCTURE, []);

    const handleStarsChange = (path: string[], value: number) => {
        setParameters((prev: TParameters) => {
            const copy = { ...prev };
            let obj: TParameters = copy;
            for (let i = 0; i < path.length - 1; i++) {
                const nested = { ...(obj[path[i]] as Record<string, number>) };
                obj[path[i]] = nested;
                obj = nested as TParameters;
            }
            obj[path[path.length - 1]] = value;
            return copy;
        });
    };

    const handleSubmit = () => {
        setWasTried(true);
        if (notAllStars) return;
        onSubmit({ parameters, comment });
    };

    return (
        <div>
            <div className="bg-base-100 shadow mb-4">
                <div className="flex flex-col gap-2 p-4">
                    <FeedbackStarsBlock parameters={parameters} onChange={handleStarsChange} />
                    <CommentField value={comment} onChange={setComment} disabled={isSubmitting} />
                    {wasTried && notAllStars && (
                        <div className="alert alert-warning alert-sm mt-2 py-1">
                            Пожалуйста, поставьте оценки по всем параметрам
                        </div>
                    )}
                    <div className="flex gap-2 mt-4">
                        {onCancel && (
                            <button
                                type="button"
                                className="btn btn-ghost flex-1"
                                onClick={onCancel}
                                disabled={isSubmitting}
                            >
                                Отмена
                            </button>
                        )}
                        <button
                            type="button"
                            className={`btn btn-primary ${onCancel ? 'flex-1' : 'btn-block'}`}
                            disabled={isSubmitting}
                            onClick={handleSubmit}
                        >
                            {isSubmitting ? (
                                <span className="loading loading-dots loading-xs" />
                            ) : (
                                (submitLabel ?? 'Отправить отзыв')
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
