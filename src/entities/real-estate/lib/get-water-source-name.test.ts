import { describe, it, expect } from 'vitest';
import { getWaterSourceName } from './get-water-source-name';
import type { TRealEstateSourceWater } from '@/shared/model';

describe('getWaterSourceName', () => {
    it.each([
        ['borehole', 'Скважина'],
        ['well', 'Колодец'],
        ['reservoir', 'Водоём'],
        ['waterSupply', 'Водопровод'],
    ] as [TRealEstateSourceWater, string][])('%s → %s', (source, expected) => {
        expect(getWaterSourceName(source)).toBe(expected);
    });

    it('fallback для неизвестного источника', () => {
        expect(getWaterSourceName('river' as TRealEstateSourceWater)).toBe('Неизвестно');
    });
});
