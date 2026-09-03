import { ClockIcon } from '@heroicons/react/24/outline';
import { MasterProfileCard } from './master-profile-card';

type TWorkCardProps = {
    linkTo?: string;
};

export function WorkCard({ linkTo = '/master/work-days' }: TWorkCardProps) {
    return (
        <MasterProfileCard
            title="Работа"
            icon={<ClockIcon className="size-6" />}
            linkTo={linkTo}
            showEditIcon={false}
        />
    );
}
