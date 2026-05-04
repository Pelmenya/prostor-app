import type { TServiceZone } from '../../model/t-service-zone';

type TZoneListItemProps = {
    zone: TServiceZone;
    isSelected: boolean;
    onToggle: (zoneId: number) => void;
};

export function ZoneListItem({ zone, isSelected, onToggle }: TZoneListItemProps) {
    const isDeactivated = !zone.isActive;
    const isDisabled = isDeactivated && !isSelected;

    return (
        <label
            className={`flex items-center gap-3 p-3 rounded-2xl border border-base-300 transition-colors ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-base-200'
            }`}
        >
            <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={isSelected}
                onChange={() => !isDisabled && onToggle(zone.id)}
                disabled={isDisabled}
            />
            <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: isDeactivated ? '#9CA3AF' : zone.color }}
            />
            <span
                className={`text-sm flex-1 min-w-0 line-clamp-1 ${
                    isDeactivated ? 'line-through text-base-content/40' : ''
                }`}
            >
                {zone.name}
            </span>
        </label>
    );
}
