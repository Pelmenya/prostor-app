'use client';

import { WaterDrop } from '@/shared/ui';
import { useClientPinStore, useEquipmentSourceStore, useWaterMapStore } from '../model';

/**
 * FAB (floating action button) bottom-right — открывает predict + equipment
 * для пина клиента. Если пина нет — FAB неактивен с tooltip-подсказкой.
 *
 * Glass-style background (slovo handoff 2026-05-15 16:00): `bg-base-100/90 +
 * backdrop-blur` чтобы water-drop icon не сливался с brand-primary background
 * (раньше синяя капля + синий фон). Унифицировано с `MapZoomControls` и
 * кнопкой «Слои» (WaterMapTopBar) — одинаковый glass-style для всех map
 * controls.
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
                absolute right-4 z-10
                size-12 rounded-full
                bg-base-100/90 backdrop-blur-md
                border border-base-content/10 shadow-md
                text-primary
                flex items-center justify-center
                transition disabled:opacity-50 disabled:cursor-not-allowed
                hover:scale-105 active:scale-95 cursor-pointer
            `}
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0) + 1rem)' }}
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
            <WaterDrop size={24} animated={!disabled} />
        </button>
    );
}
