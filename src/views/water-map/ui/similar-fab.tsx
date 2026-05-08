'use client';

import { WaterDrop } from '@/shared/ui';
import { useClientPinStore, useEquipmentSourceStore, useWaterMapStore } from '../model';

/**
 * FAB (floating action button) bottom-right — открывает predict + equipment
 * для пина клиента. Если пина нет — FAB неактивен с tooltip-подсказкой.
 */
export function SimilarFab() {
    const pin = useClientPinStore((s) => s.pin);
    const setPredictOpen = useWaterMapStore((s) => s.setPredictOpen);
    const setEquipmentSource = useEquipmentSourceStore((s) => s.setSource);

    const disabled = !pin;
    const onClick = () => {
        if (disabled || !pin) return;
        // Выставляем источник равен pin'у — EquipmentModal (если откроется
        // через CTA в predict-modal) увидит правильные coords + source='pin'.
        setEquipmentSource({ lat: pin.lat, lon: pin.lon, source: 'pin', label: pin.label });
        setPredictOpen(true);
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`
                pointer-events-auto
                absolute bottom-4 right-4 z-10
                size-14 rounded-full shadow-lg
                bg-primary text-primary-content
                flex items-center justify-center
                transition disabled:opacity-50 disabled:cursor-not-allowed
                hover:scale-105 active:scale-95
            `}
            style={{ marginBottom: 'env(safe-area-inset-bottom, 0)' }}
            aria-label={
                disabled
                    ? 'Поставьте пин на карте чтобы увидеть прогноз'
                    : 'Прогноз воды для вашего пина'
            }
            title={
                disabled
                    ? 'Поставьте пин на карте чтобы увидеть прогноз'
                    : 'Прогноз воды для вашего пина'
            }
        >
            <WaterDrop size={28} animated={!disabled} />
        </button>
    );
}
