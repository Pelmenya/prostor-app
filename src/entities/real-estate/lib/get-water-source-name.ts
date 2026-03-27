import type { TRealEstateSourceWater } from '@/shared/model';

const SOURCE_NAMES: Record<TRealEstateSourceWater, string> = {
    borehole: 'Скважина',
    well: 'Колодец',
    reservoir: 'Водоём',
    waterSupply: 'Водопровод',
};

export function getWaterSourceName(source: TRealEstateSourceWater): string {
    return SOURCE_NAMES[source] ?? 'Неизвестно';
}
