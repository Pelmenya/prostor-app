import { StarIcon } from '@heroicons/react/24/outline';
import { MasterProfileCard } from './master-profile-card';
import { StarRating } from '@/shared/ui';

type TRatingCardProps = {
    avgRating?: number;
};

export function RatingCard({ avgRating }: TRatingCardProps) {
    return (
        <MasterProfileCard
            title="Рейтинг"
            icon={<StarIcon className="size-6" />}
            showEditIcon={false}
        >
            <StarRating avgRating={avgRating} />
        </MasterProfileCard>
    );
}
