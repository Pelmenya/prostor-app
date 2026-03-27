import type { TWaterIntakePoints } from '@/shared/model';

export const POINT_NAMES: Record<keyof TWaterIntakePoints, string> = {
    toilet: 'Унитаз',
    sink: 'Раковина',
    bath: 'Ванна',
    washingMachine: 'Стиральная машина',
    dishWasher: 'Посудомоечная машина',
    showerCabin: 'Душевая кабина',
};

export function getWaterIntakePointName(key: keyof TWaterIntakePoints): string {
    return POINT_NAMES[key] ?? key;
}
