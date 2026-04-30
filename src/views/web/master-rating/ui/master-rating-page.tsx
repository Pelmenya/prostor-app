'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftIcon, StarIcon } from '@heroicons/react/20/solid';
import {
    useGetExecutorDetailedRating,
    ReviewCard,
    CategoryCollapse,
    FEEDBACK_STRUCTURE,
} from '@/entities/order-feedback';
import { useGetMasterById } from '@/features/master-public';
import { QueryBoundary } from '@/shared/ui';
import type { TReviewItem } from '@/shared/model';

type TSortOption = 'new' | 'old' | 'high' | 'low';

type TMasterRatingPageProps = {
    masterId: number;
};

export function MasterRatingPage({ masterId }: TMasterRatingPageProps) {
    return (
        <QueryBoundary errorMessage="Не удалось загрузить рейтинг мастера">
            <MasterRatingContent masterId={masterId} />
        </QueryBoundary>
    );
}

const CRITERION_LABELS: Record<string, string> = Object.fromEntries(
    FEEDBACK_STRUCTURE.flatMap((cat) =>
        (cat.children ?? []).map((child) => [child.key, child.label]),
    ),
);

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
    FEEDBACK_STRUCTURE.map((cat) => [cat.key, cat.label]),
);

function sortReviews(reviews: TReviewItem[], sort: TSortOption): TReviewItem[] {
    return [...reviews].sort((a, b) => {
        switch (sort) {
            case 'new':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'old':
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'high':
                return b.avg - a.avg;
            case 'low':
                return a.avg - b.avg;
        }
    });
}

function MasterRatingContent({ masterId }: { masterId: number }) {
    const [sort, setSort] = useState<TSortOption>('new');
    const { data: master } = useGetMasterById(masterId);
    const { data: rating } = useGetExecutorDetailedRating(masterId);

    const sortedReviews = sortReviews(rating.reviews, sort);
    const overall = Math.min(Math.max(rating.overall, 0), 5);

    const categoriesWithLabels = rating.categories.map((cat) => ({
        ...cat,
        key: CATEGORY_LABELS[cat.key] ?? cat.key,
    }));

    return (
        <div className="flex flex-col">
            <div className="bg-base-100 border-b border-base-200 p-4 flex items-center gap-3">
                <Link href={`/master/${masterId}`} className="btn btn-ghost btn-sm btn-circle">
                    <ArrowLeftIcon className="size-4" />
                </Link>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="avatar">
                        <div className="size-10 rounded-full">
                            {master.photo_url ? (
                                <Image
                                    src={master.photo_url}
                                    alt={master.first_name}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover"
                                />
                            ) : (
                                <div className="bg-primary/10 size-10 rounded-full flex items-center justify-center font-semibold">
                                    {master.first_name[0]}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                            {master.first_name} {master.last_name}
                        </p>
                        <p className="text-xs text-base-content/50">Рейтинг мастера</p>
                    </div>
                </div>
            </div>

            <div className="p-4 flex flex-col gap-5">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                        <span className="text-4xl font-bold text-warning">
                            {overall.toLocaleString('ru-RU', {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                            })}
                        </span>
                        <div className="flex gap-0.5 mt-1">
                            {Array.from({ length: 5 }, (_, i) => (
                                <StarIcon
                                    key={i}
                                    className={`size-4 ${i < Math.round(overall) ? 'text-warning' : 'text-warning/20'}`}
                                />
                            ))}
                        </div>
                        <span className="text-xs text-base-content/50 mt-1">
                            {rating.totalFeedbacks} отзыв
                            {rating.totalFeedbacks % 10 === 1 && rating.totalFeedbacks % 100 !== 11
                                ? ''
                                : rating.totalFeedbacks % 10 >= 2 &&
                                    rating.totalFeedbacks % 10 <= 4 &&
                                    !(
                                        rating.totalFeedbacks % 100 >= 12 &&
                                        rating.totalFeedbacks % 100 <= 14
                                    )
                                  ? 'а'
                                  : 'ов'}
                        </span>
                    </div>
                </div>

                {categoriesWithLabels.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <h2 className="font-semibold text-sm text-base-content/70 uppercase tracking-wide">
                            По категориям
                        </h2>
                        {categoriesWithLabels.map((cat) => (
                            <CategoryCollapse
                                key={cat.key}
                                category={cat}
                                criterionLabels={CRITERION_LABELS}
                            />
                        ))}
                    </div>
                )}

                {sortedReviews.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-sm text-base-content/70 uppercase tracking-wide">
                                Отзывы
                            </h2>
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value as TSortOption)}
                                className="select select-bordered select-xs"
                            >
                                <option value="new">Новые</option>
                                <option value="old">Старые</option>
                                <option value="high">Высокая оценка</option>
                                <option value="low">Низкая оценка</option>
                            </select>
                        </div>
                        {sortedReviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </div>
                )}

                {rating.totalFeedbacks === 0 && (
                    <div className="text-center py-8 text-base-content/40">
                        <StarIcon className="size-10 mx-auto mb-2 text-base-content/20" />
                        <p>Отзывов пока нет</p>
                    </div>
                )}
            </div>
        </div>
    );
}
