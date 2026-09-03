import type { TInstalledEquipment } from '@/shared/model';
import { getDaysLeft, getResourcePercent } from './get-resource-percent';

/**
 * Возвращает статистику по самому критичному незаменённому компоненту
 * среди активного оборудования. Возвращает null, если компонентов нет.
 */
export function getCriticalStats(
    equipment: TInstalledEquipment[],
): { daysLeft: number; percent: number } | null {
    const components = equipment
        .filter((e) => e.isActive)
        .flatMap((e) => e.components.filter((c) => !c.isReplaced));

    if (components.length === 0) return null;

    const critical = components.reduce((min, c) =>
        getDaysLeft(c.nextReplacementDate) < getDaysLeft(min.nextReplacementDate) ? c : min,
    );

    return {
        daysLeft: getDaysLeft(critical.nextReplacementDate),
        percent: getResourcePercent(critical.installedAt, critical.nextReplacementDate),
    };
}
