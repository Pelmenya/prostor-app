'use client';

import { HomeModernIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { TRealEstate } from '@/shared/model';
import { getWaterSourceName } from '../../lib/get-water-source-name';
import { TYPE_ICONS } from '../../lib/real-estate-type-icons';

type TRealEstateCardProps = {
    realEstate: TRealEstate;
    onDelete?: (id: number) => void;
    showEditIcon?: boolean;
    onClick?: (id: number) => void;
    criticalDaysLeft?: number | null;
    criticalPercent?: number;
};

export function RealEstateCard({
    realEstate,
    onDelete,
    showEditIcon,
    onClick,
    criticalDaysLeft,
    criticalPercent,
}: TRealEstateCardProps) {
    const Icon = TYPE_ICONS[realEstate.activeType] ?? HomeModernIcon;

    const progressColor =
        criticalPercent === undefined
            ? 'progress-success'
            : criticalPercent >= 50
              ? 'progress-success'
              : criticalPercent >= 20
                ? 'progress-warning'
                : 'progress-error';

    const daysClassName =
        criticalDaysLeft == null
            ? ''
            : criticalDaysLeft <= 7
              ? 'text-error font-semibold'
              : criticalDaysLeft <= 30
                ? 'text-warning font-semibold'
                : 'text-base-content/60';

    return (
        <div
            className={`bg-base-100 border border-base-300 shadow-sm rounded-2xl transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
            onClick={onClick ? () => onClick(realEstate.id) : undefined}
        >
            <div className="card-body p-4 flex-row items-center gap-3">
                <Icon className="size-10 text-primary shrink-0" />
                <div className="divider divider-horizontal m-0 shrink-0 self-stretch" />
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-[110%] line-clamp-2 wrap-break-word">
                        {realEstate.address || 'Адрес не указан'}
                    </p>
                    <div className="flex gap-2 text-xs text-base-content/50">
                        <span>{realEstate.residents} чел.</span>
                        <span>{getWaterSourceName(realEstate.activeSource)}</span>
                    </div>
                    {criticalDaysLeft != null && (
                        <div className="flex flex-col gap-1 mt-0.5">
                            <progress
                                className={`progress ${progressColor} h-1 w-full`}
                                value={criticalPercent ?? 100}
                                max={100}
                            />
                            <p className="text-xs text-base-content/50">
                                Ближайшая замена через{' '}
                                <span className={daysClassName}>{criticalDaysLeft} дн.</span>
                            </p>
                        </div>
                    )}
                </div>
                {showEditIcon && <PencilSquareIcon className="size-6" />}
                {onDelete && (
                    <button
                        className="btn btn-ghost btn-sm btn-square shrink-0"
                        aria-label="Удалить адрес"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(realEstate.id);
                        }}
                    >
                        <TrashIcon className="size-4 text-error" />
                    </button>
                )}
            </div>
        </div>
    );
}
