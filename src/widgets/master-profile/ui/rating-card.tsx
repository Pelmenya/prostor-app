import { StarIcon } from '@heroicons/react/24/outline';
import { MasterProfileCard } from './master-profile-card';
import { StarRating } from '@/shared/ui';
import { useGetExecutorAverageRating } from '@/entities/order-feedback';

type TRatingCardProps = {
    userId?: number;
};

export function RatingCard({ userId }: TRatingCardProps) {
    const { data, isLoading, isError } = useGetExecutorAverageRating(userId);

    return (
        <MasterProfileCard
            title="Рейтинг"
            icon={<StarIcon className="size-6" />}
            linkTo={userId ? `/master/${userId}/rating` : undefined}
            showEditIcon={false}
        >
            {isLoading && <span className="loading loading-spinner loading-sm" />}
            {isError && <span className="text-error text-xs">Ошибка загрузки рейтинга</span>}
            {!isLoading && !isError && <StarRating avgRating={data?.average} />}
        </MasterProfileCard>
    );
}
