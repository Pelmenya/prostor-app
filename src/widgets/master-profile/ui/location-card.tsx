import { MapPinIcon } from '@heroicons/react/24/outline';
import { MasterProfileCard } from './master-profile-card';
import type { EDepartureBasis } from '@/entities/account-service';

type TLocationCardProps = {
    address?: string | null;
    departureBasis?: EDepartureBasis | null;
    isLoading?: boolean;
    linkTo?: string;
    readOnly?: boolean;
    outlined?: boolean;
};

const DEPARTURE_LABELS: Record<string, string> = {
    OWN_ADDRESS: 'от адреса',
    NEAREST_STORE: 'от ближайшего склада',
};

export function LocationCard({
    address,
    departureBasis,
    isLoading = false,
    linkTo = '/dashboard/master/location',
    readOnly = false,
    outlined = false,
}: TLocationCardProps) {
    const departureLabel = departureBasis ? DEPARTURE_LABELS[departureBasis] : null;

    return (
        <MasterProfileCard
            title={readOnly ? 'Локация' : 'Ваша локация'}
            icon={<MapPinIcon className="size-6" />}
            linkTo={linkTo}
            readOnly={readOnly}
            outlined={outlined}
        >
            {isLoading ? (
                <span className="loading loading-spinner loading-xs text-primary" />
            ) : (
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
            )}
        </MasterProfileCard>
    );
}
