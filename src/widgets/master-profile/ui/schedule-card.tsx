import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { MasterProfileCard } from './master-profile-card';

type TScheduleCardProps = {
    linkTo?: string;
    readOnly?: boolean;
};

export function ScheduleCard({
    linkTo = '/dashboard/master/schedule',
    readOnly = false,
}: TScheduleCardProps) {
    return (
        <MasterProfileCard
            title="График работы"
            icon={<ClipboardDocumentListIcon className="size-6" />}
            linkTo={linkTo}
            readOnly={readOnly}
        />
    );
}
