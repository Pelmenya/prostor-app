import { describe, it, expect } from 'vitest';
import { getWaterIntakePointName } from './get-water-intake-point-name';
import type { TWaterIntakePoints } from '@/shared/model';

describe('getWaterIntakePointName', () => {
    it.each([
        ['toilet', 'Унитаз'],
        ['sink', 'Раковина'],
        ['bath', 'Ванна'],
        ['washingMachine', 'Стиральная машина'],
        ['dishWasher', 'Посудомоечная машина'],
        ['showerCabin', 'Душевая кабина'],
    ] as [keyof TWaterIntakePoints, string][])('%s → %s', (key, expected) => {
        expect(getWaterIntakePointName(key)).toBe(expected);
    });
});
