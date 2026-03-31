'use client';

import { HomeModernIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { TRealEstate } from '@/shared/model';
import { getRealEstateTypeName } from '../../lib/get-real-estate-type-name';
import { getWaterSourceName } from '../../lib/get-water-source-name';
import { TYPE_ICONS } from '../../lib/real-estate-type-icons';

type TRealEstateCardProps = {
    realEstate: TRealEstate;
    onDelete?: (id: number) => void;
    onClick?: (id: number) => void;
};

export function RealEstateCard({ realEstate, onDelete, onClick }: TRealEstateCardProps) {
    const Icon = TYPE_ICONS[realEstate.activeType] ?? HomeModernIcon;

    return (
        <div
            className={`card bg-base-100 border border-base-300 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
            onClick={onClick ? () => onClick(realEstate.id) : undefined}
        >
            <div className="card-body p-4 flex-row items-center gap-3">
                <Icon className="size-10 text-primary shrink-0" />
                <div className="divider divider-horizontal m-0 shrink-0 self-stretch" />
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <h3 className="font-semibold text-sm">
                        {getRealEstateTypeName(realEstate.activeType)}
                    </h3>
                    <p className="text-xs text-base-content/70 line-clamp-2 wrap-break-word">
                        {realEstate.address || 'Адрес не указан'}
                    </p>
                    <div className="flex gap-2 text-xs text-base-content/50">
                        <span>{realEstate.residents} чел.</span>
                        <span>{getWaterSourceName(realEstate.activeSource)}</span>
                    </div>
                </div>
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
