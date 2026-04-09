import type { ReactNode } from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import type { TInstalledEquipment, TInstalledComponent } from '@/shared/model';
import { formatDateRu } from '@/shared/lib';
import { CardImage } from '@/shared/ui';

type TEquipmentCardProps = {
    equipment: TInstalledEquipment;
    imageUrl?: string;
    isImageLoading?: boolean;
    onDemount?: () => void;
    renderComponent?: (component: TInstalledComponent) => ReactNode;
};

export function EquipmentCard({
    equipment,
    imageUrl,
    isImageLoading,
    onDemount,
    renderComponent,
}: TEquipmentCardProps) {
    const activeComponents = equipment.components
        .filter((c) => !c.isReplaced)
        .sort(
            (a, b) =>
                new Date(a.nextReplacementDate).getTime() -
                new Date(b.nextReplacementDate).getTime(),
        );

    return (
        <div className="relative flex flex-col gap-3 p-4 bg-base-100 border border-base-300 rounded-2xl w-full">
            <div className="flex gap-3">
                <CardImage
                    src={imageUrl}
                    isLoading={isImageLoading ?? false}
                    className="h-16 w-12 shrink-0 rounded-xl"
                    imgClassName="size-full object-contain"
                    alt={equipment.productName}
                />
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="font-semibold text-sm line-clamp-2 leading-110">
                        {equipment.productName}
                    </span>
                    <span className="text-xs text-base-content/50">
                        Установлен: {formatDateRu(equipment.installedAt)}
                    </span>
                    {onDemount && (
                        <button
                            type="button"
                            onClick={onDemount}
                            className="flex items-center gap-1 mt-1 text-xs text-base-content/40 hover:text-error transition-colors w-fit"
                        >
                            <WrenchScrewdriverIcon className="size-3.5" />
                            Демонтировать
                        </button>
                    )}
                </div>
            </div>

            {renderComponent && activeComponents.length > 0 && (
                <div className="flex flex-col gap-3">
                    {activeComponents.map((c) => renderComponent(c))}
                </div>
            )}

            {activeComponents.length === 0 && (
                <p className="text-xs text-base-content/40 text-center py-1">
                    Все компоненты заменены
                </p>
            )}
        </div>
    );
}
