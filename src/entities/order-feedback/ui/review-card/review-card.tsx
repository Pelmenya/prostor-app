import Image from 'next/image';
import { StarIcon } from '@heroicons/react/20/solid';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import type { TReviewItem } from '@/shared/model';

type TReviewCardProps = {
    review: TReviewItem;
};

export function ReviewCard({ review }: TReviewCardProps) {
    const rating = Math.min(Math.max(review.avg, 0), 5);
    const date = new Date(review.createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="card bg-base-100 border border-base-200 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <div className="avatar">
                    <div className="size-10 rounded-full">
                        {review.author.photo_url ? (
                            <Image
                                src={review.author.photo_url}
                                alt={review.author.first_name}
                                width={40}
                                height={40}
                                className="rounded-full object-cover"
                            />
                        ) : (
                            <div className="bg-primary/10 size-10 rounded-full flex items-center justify-center font-semibold">
                                {review.author.first_name?.[0] ?? '?'}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                        {review.author.first_name}
                        {review.author.last_name ? ` ${review.author.last_name}` : ''}
                    </p>
                    <p className="text-xs text-base-content/50">{date}</p>
                </div>
                <div className="flex items-center gap-1">
                    <StarIcon className="size-4 text-warning" />
                    <span className="text-sm font-semibold">
                        {rating.toLocaleString('ru-RU', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                        })}
                    </span>
                </div>
            </div>

            {review.comment && <p className="text-sm text-base-content/80">{review.comment}</p>}

            {review.reply && (
                <div className="bg-base-200 rounded-xl p-3 flex gap-2">
                    <ChatBubbleLeftEllipsisIcon className="size-4 shrink-0 mt-0.5 text-base-content/50" />
                    <div className="flex flex-col gap-1">
                        <p className="text-xs font-medium text-base-content/60">
                            Ответ куратора
                            {review.repliedAt &&
                                ` · ${new Date(review.repliedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`}
                        </p>
                        <p className="text-sm">{review.reply}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
