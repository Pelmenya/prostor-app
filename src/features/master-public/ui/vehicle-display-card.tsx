import { TruckIcon } from '@heroicons/react/24/outline';
import { CardWrapper } from '@/shared/ui/card-wrapper';

type TVehicleDisplayCardProps = {
    carModel?: string | null;
    carNumber?: string | null;
    maxCargoLength?: number | null;
    maxCargoWidth?: number | null;
    maxCargoHeight?: number | null;
    maxCargoWeight?: number | null;
};

export function VehicleDisplayCard({
    carModel,
    carNumber,
    maxCargoLength,
    maxCargoWidth,
    maxCargoHeight,
    maxCargoWeight,
}: TVehicleDisplayCardProps) {
    const carParts = [carModel, carNumber ? `ГОС номер: ${carNumber}` : null]
        .filter(Boolean)
        .join(', ');

    const cargoParts = [
        maxCargoLength != null && `Длина, см: ${maxCargoLength}`,
        maxCargoWidth != null && `Ширина, см: ${maxCargoWidth}`,
        maxCargoHeight != null && `Высота, см: ${maxCargoHeight}`,
        maxCargoWeight != null && `Макс. вес, кг: ${maxCargoWeight}`,
    ]
        .filter(Boolean)
        .join(', ');

    return (
        <CardWrapper outlined>
            <div className="flex items-center gap-4 w-full">
                <TruckIcon className="size-6 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <h5 className="font-semibold">Автомобиль</h5>
                    <div className="divider m-0" />
                    {carParts ? (
                        <>
                            <p className="text-sm text-base-content/70">{carParts}</p>
                            {cargoParts && (
                                <>
                                    <div className="divider m-0" />
                                    <p className="text-sm text-base-content/70">{cargoParts}</p>
                                </>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-base-content/40">Не указан</p>
                    )}
                </div>
            </div>
        </CardWrapper>
    );
}
