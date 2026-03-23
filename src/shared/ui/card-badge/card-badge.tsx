import { CubeIcon, UserIcon } from '@heroicons/react/20/solid';
import { WrenchScrewdriverIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/16/solid';

type TCardBadgeVariant = 'product' | 'service' | 'installation' | 'maintenance';

type TCardBadgeProps = {
    variant: TCardBadgeVariant;
};

const VARIANT_CONFIG: Record<TCardBadgeVariant, { icon: React.ReactNode; label: string }> = {
    product: { icon: <CubeIcon className="size-3" />, label: 'Товар' },
    service: { icon: <UserIcon className="size-3" />, label: 'Услуга' },
    installation: { icon: <WrenchScrewdriverIcon className="size-3" />, label: 'Монтаж' },
    maintenance: { icon: <ArrowPathRoundedSquareIcon className="size-3" />, label: 'Сервис' },
};

export function CardBadge({ variant }: TCardBadgeProps) {
    const { icon, label } = VARIANT_CONFIG[variant];

    return (
        <span className="badge badge-sm border-base-300 absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <span className="flex items-center gap-2 font-semibold leading-6">
                {icon}
                {label}
            </span>
        </span>
    );
}
