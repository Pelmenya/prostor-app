import Image from 'next/image';
import { PhoneIcon, UserIcon } from '@heroicons/react/24/outline';
import type { TOrder } from '@/entities/order';
import { formatUserInitials } from '@/shared/lib';

type TClientCardProps = {
    client: NonNullable<TOrder['client']>;
};

export function ClientCard({ client }: TClientCardProps) {
    const clientName = [client.first_name, client.last_name].filter(Boolean).join(' ') || null;

    return (
        <div className="card bg-base-100 p-4 flex flex-col gap-3">
            <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
                Клиент
            </p>
            <div className="flex items-center gap-3">
                {client.photo_url ? (
                    <Image
                        src={client.photo_url}
                        alt={clientName ?? ''}
                        width={40}
                        height={40}
                        className="rounded-full object-cover shrink-0"
                    />
                ) : (
                    <div className="avatar avatar-placeholder shrink-0">
                        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <span className="text-sm font-semibold">
                                {formatUserInitials(client.first_name, client.last_name) ?? (
                                    <UserIcon className="size-5" />
                                )}
                            </span>
                        </div>
                    </div>
                )}
                <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-medium text-sm leading-tight">{clientName}</span>
                    {client.phone && (
                        <a
                            href={`tel:${client.phone}`}
                            className="flex items-center gap-1 text-primary text-sm"
                        >
                            <PhoneIcon className="size-3.5" />
                            {client.phone}
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
