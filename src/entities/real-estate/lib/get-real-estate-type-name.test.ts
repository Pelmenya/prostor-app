import { describe, it, expect } from 'vitest';
import { getRealEstateTypeName } from './get-real-estate-type-name';
import type { TRealEstateType } from '@/shared/model';

describe('getRealEstateTypeName', () => {
    it.each([
        ['house', 'Дом'],
        ['apartment', 'Квартира'],
        ['prom', 'Промобъект'],
    ] as [TRealEstateType, string][])('%s → %s', (type, expected) => {
        expect(getRealEstateTypeName(type)).toBe(expected);
    });

    it('fallback для неизвестного типа', () => {
        expect(getRealEstateTypeName('unknown' as TRealEstateType)).toBe('Объект');
    });
});
