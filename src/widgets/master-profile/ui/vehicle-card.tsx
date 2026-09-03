import { TruckIcon } from '@heroicons/react/24/outline';
import { MasterProfileCard } from './master-profile-card';

type TVehicleCardProps = {
    carModel?: string | null;
    carNumber?: string | null;
    maxCargoLength?: number | null;
    maxCargoWidth?: number | null;
    maxCargoHeight?: number | null;
    maxCargoWeight?: number | null;
    linkTo?: string;
    readOnly?: boolean;
    outlined?: boolean;
};

export function VehicleCard({
    carModel,
    carNumber,
    maxCargoLength,
    maxCargoWidth,
    maxCargoHeight,
    maxCargoWeight,
    linkTo = '/master/vehicle',
    readOnly = false,
    outlined = false,
}: TVehicleCardProps) {
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
        <MasterProfileCard
            title="Автомобиль"
            icon={<TruckIcon className="size-6" />}
            linkTo={linkTo}
            readOnly={readOnly}
            outlined={outlined}
        >
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
                <p className="text-sm text-base-content/40">Укажите данные автомобиля</p>
            )}
        </MasterProfileCard>
    );
}
