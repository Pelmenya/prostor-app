import { StarIcon } from '@heroicons/react/24/outline';
import { MasterProfileCard } from './master-profile-card';
import { StarRating } from '@/shared/ui';

type TRatingCardProps = {
    avgRating?: number;
    linkTo?: string;
};

export function RatingCard({ avgRating, linkTo }: TRatingCardProps) {
    return (
        <MasterProfileCard
            title="Рейтинг"
            icon={<StarIcon className="size-6" />}
            linkTo={linkTo}
            showEditIcon={!!linkTo}
        >
            <StarRating avgRating={avgRating} />
        </MasterProfileCard>
    );
}
