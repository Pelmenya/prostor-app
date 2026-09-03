'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StarIcon, ArrowLeftIcon } from '@heroicons/react/20/solid';
import {
    useGetExecutorDetailedRating,
    ReviewCard,
    CategoryCollapse,
    FEEDBACK_STRUCTURE,
} from '@/entities/order-feedback';
import { UserIcon } from '@heroicons/react/24/outline';
import { PageContainer, PageTitle, PageSpinner, QueryBoundary } from '@/shared/ui';
import { useAuth } from '@/shared/lib/platform';
import { clamp, pluralizeRu, useIsClient } from '@/shared/lib';
import type { TReviewItem } from '@/shared/model';

type TSortOption = 'new' | 'old' | 'high' | 'low';

type TMasterRatingPageProps = {
    masterId: number;
};

export function MasterRatingPage({ masterId }: TMasterRatingPageProps) {
    const isClient = useIsClient();
    const { isAuthenticated } = useAuth();

    if (!isClient) return <PageSpinner />;
    if (!isAuthenticated) return <RatingAuthWall masterId={masterId} />;
    return (
        <QueryBoundary errorMessage="Не удалось загрузить рейтинг мастера">
            <MasterRatingContent masterId={masterId} />
        </QueryBoundary>
    );
}

function RatingAuthWall({ masterId }: TMasterRatingPageProps) {
    const pathname = usePathname();
    return (
        <PageContainer>
            <div className="flex items-center gap-2 mb-4">
                <Link
                    href={`/master/${masterId}`}
                    className="btn btn-ghost btn-sm btn-circle -ml-2"
                >
                    <ArrowLeftIcon className="size-4" />
                </Link>
                <PageTitle>Отзывы</PageTitle>
            </div>
            <div className="max-w-lg mx-auto w-full">
                <div className="flex flex-col items-center gap-4 p-8 bg-base-100 border border-base-300 rounded-2xl text-center">
                    <UserIcon className="size-12 text-base-content/20" />
                    <div className="flex flex-col gap-1">
                        <p className="font-semibold">Войдите в аккаунт</p>
                        <p className="text-sm text-base-content/50">
                            Чтобы просмотреть отзывы, необходимо авторизоваться
                        </p>
                    </div>
                    <Link
                        href={`/login?from=${encodeURIComponent(pathname)}`}
                        className="btn btn-primary btn-sm"
                    >
                        Войти
                    </Link>
                </div>
            </div>
        </PageContainer>
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
    const { data: rating } = useGetExecutorDetailedRating(masterId);

    const sortedReviews = sortReviews(rating.reviews, sort);
    const overall = clamp(rating.overall, 0, 5);

    const categoriesWithLabels = rating.categories.map((cat) => ({
        ...cat,
        key: CATEGORY_LABELS[cat.key] ?? cat.key,
    }));

    return (
        <PageContainer>
            <div className="flex items-center gap-2 mb-4">
                <Link
                    href={`/master/${masterId}`}
                    className="btn btn-ghost btn-sm btn-circle -ml-2"
                >
                    <ArrowLeftIcon className="size-4" />
                </Link>
                <PageTitle>Отзывы</PageTitle>
            </div>

            <div className="flex flex-col gap-4 pb-4 max-w-lg mx-auto w-full">
                {/* Общая оценка */}
                <div className="flex items-center gap-4 p-4 bg-base-100 border border-base-300 rounded-2xl">
                    <div className="flex flex-col items-center shrink-0">
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
                    </div>
                    <div className="divider divider-horizontal m-0 self-stretch" />
                    <div className="flex flex-col gap-0.5">
                        <span className="font-semibold leading-[110%]">
                            {rating.totalFeedbacks}{' '}
                            {pluralizeRu(rating.totalFeedbacks, ['отзыв', 'отзыва', 'отзывов'])}
                        </span>
                        <span className="text-sm text-base-content/50">Общий рейтинг</span>
                    </div>
                </div>

                {/* По категориям */}
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

                {/* Отзывы */}
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
                    <div className="p-8 bg-base-100 border border-base-300 rounded-2xl text-center">
                        <StarIcon className="size-10 mx-auto mb-2 text-base-content/20" />
                        <p className="text-base-content/40 text-sm">Отзывов пока нет</p>
                    </div>
                )}
            </div>
        </PageContainer>
    );
}
