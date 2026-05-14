import { HomeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import type { TOrder } from '@/entities/order';

type TAddressCardProps = {
    realEstate: NonNullable<TOrder['realEstate']>;
};

export function AddressCard({ realEstate }: TAddressCardProps) {
    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-2">
            <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                Адрес
            </p>
            <div className="flex items-start gap-2">
                <HomeIcon className="size-5 shrink-0 text-base-content/40 mt-0.5" />
                <span className="text-sm">{realEstate.address}</span>
            </div>
            {realEstate.city && (
                <div className="flex items-center gap-2">
                    <MapPinIcon className="size-5 shrink-0 text-base-content/40" />
                    <span className="text-sm text-base-content/60">{realEstate.city}</span>
                </div>
            )}
        </div>
    );
}
