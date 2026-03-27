import type { TRealEstateType } from '@/shared/model';

export const TYPE_NAMES: Record<TRealEstateType, string> = {
    house: 'Дом',
    apartment: 'Квартира',
    prom: 'Промобъект',
};

export function getRealEstateTypeName(type: TRealEstateType): string {
    return TYPE_NAMES[type];
}
