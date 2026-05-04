import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { MasterProfileCard } from './master-profile-card';

type TServiceAreaCardProps = {
    zoneCount?: number;
    linkTo?: string;
    readOnly?: boolean;
};

export function ServiceAreaCard({
    zoneCount,
    linkTo = '/master/area',
    readOnly = false,
}: TServiceAreaCardProps) {
    return (
        <MasterProfileCard
            title="Зоны обслуживания"
            icon={<GlobeAltIcon className="size-6" />}
            linkTo={linkTo}
            readOnly={readOnly}
        >
            <p className="text-sm text-base-content/70">
                {zoneCount ? `Выбрано зон: ${zoneCount}` : 'Зоны обслуживания не выбраны'}
            </p>
        </MasterProfileCard>
    );
}
