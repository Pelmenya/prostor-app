import { MapPinIcon } from '@heroicons/react/24/outline';
import { CardWrapper } from '@/shared/ui/card-wrapper';
import { getDepartureBasisLabel, type EDepartureBasis } from '@/entities/account-service';

type TLocationDisplayCardProps = {
    address?: string | null;
    departureBasis?: EDepartureBasis | null;
};

export function LocationDisplayCard({ address, departureBasis }: TLocationDisplayCardProps) {
    const departureLabel = departureBasis ? getDepartureBasisLabel(departureBasis) : null;

    return (
        <CardWrapper outlined>
            <div className="flex items-center gap-4 w-full">
                <MapPinIcon className="size-6 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <h5 className="font-semibold">Локация</h5>
                    <div className="divider m-0" />
                    <div className="flex flex-col">
                        <p className="text-sm text-base-content/70 line-clamp-1">
                            {address ?? 'Не указана'}
                        </p>
                        {departureLabel && (
                            <>
                                <div className="divider m-0" />
                                <p className="text-sm text-base-content/70">
                                    Выезд: {departureLabel}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </CardWrapper>
    );
}
