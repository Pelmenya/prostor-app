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

    it('все типы покрыты', () => {
        expect(getRealEstateTypeName('house')).toBeDefined();
        expect(getRealEstateTypeName('apartment')).toBeDefined();
        expect(getRealEstateTypeName('prom')).toBeDefined();
    });
});
