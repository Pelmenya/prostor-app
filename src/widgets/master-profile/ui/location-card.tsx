import { MapPinIcon } from '@heroicons/react/24/outline';
import { MasterProfileCard } from './master-profile-card';
import { getDepartureBasisLabel, type EDepartureBasis } from '@/entities/account-service';

type TLocationCardProps = {
    address?: string | null;
    departureBasis?: EDepartureBasis | null;
    linkTo?: string;
    readOnly?: boolean;
    outlined?: boolean;
};

export function LocationCard({
    address,
    departureBasis,
    linkTo = '/dashboard/master/location',
    readOnly = false,
    outlined = false,
}: TLocationCardProps) {
    const departureLabel = departureBasis ? getDepartureBasisLabel(departureBasis) : null;

    return (
        <MasterProfileCard
            title={readOnly ? 'Локация' : 'Ваша локация'}
            icon={<MapPinIcon className="size-6" />}
            linkTo={linkTo}
            readOnly={readOnly}
            outlined={outlined}
        >
            <div className="flex flex-col">
                <p className="text-sm text-base-content/70 line-clamp-1">
                    {address ?? 'Укажите локацию'}
                </p>
                {departureLabel && (
                    <>
                        <div className="divider m-0" />
                        <p className="text-sm text-base-content/70">Выезд: {departureLabel}</p>
                    </>
                )}
            </div>
        </MasterProfileCard>
    );
}
