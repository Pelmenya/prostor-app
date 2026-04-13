import { ArchiveBoxIcon } from '@heroicons/react/24/outline';
import type { TInstalledEquipment } from '@/shared/model';
import { formatDateRu } from '@/shared/lib';

type TArchivedEquipmentRowProps = {
    equipment: TInstalledEquipment;
};

export function ArchivedEquipmentRow({ equipment }: TArchivedEquipmentRowProps) {
    return (
        <div className="flex items-center gap-3 py-2.5">
            <ArchiveBoxIcon className="size-5 shrink-0 text-base-content/30" />
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-sm line-clamp-1">{equipment.productName}</span>
                <span className="text-xs text-base-content/40">
                    Установлен: {formatDateRu(equipment.installedAt)}
                </span>
            </div>
        </div>
    );
}
