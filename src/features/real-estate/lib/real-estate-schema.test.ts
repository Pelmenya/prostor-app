import { describe, it, expect } from 'vitest';
import { realEstateSchema, DEFAULT_FORM_VALUES } from './real-estate-schema';

const VALID = { ...DEFAULT_FORM_VALUES, address: 'Москва, ул. Ленина, 1' };

describe('realEstateSchema', () => {
    it('валидирует корректные данные', () => {
        expect(realEstateSchema.safeParse(VALID).success).toBe(true);
    });

    it('ошибка при пустом адресе', () => {
        expect(realEstateSchema.safeParse({ ...VALID, address: '' }).success).toBe(false);
    });

    it('ошибка при residents = 0', () => {
        expect(realEstateSchema.safeParse({ ...VALID, residents: 0 }).success).toBe(false);
    });

    it('ошибка при residents > 50', () => {
        expect(realEstateSchema.safeParse({ ...VALID, residents: 51 }).success).toBe(false);
    });

    it('ошибка при невалидном activeType', () => {
        expect(realEstateSchema.safeParse({ ...VALID, activeType: 'castle' }).success).toBe(false);
    });

    it('ошибка при невалидном activeSource', () => {
        expect(realEstateSchema.safeParse({ ...VALID, activeSource: 'river' }).success).toBe(false);
    });

    it('допускает waterIntakePoints = 0', () => {
        const result = realEstateSchema.safeParse({
            ...VALID,
            waterIntakePoints: {
                toilet: 0,
                sink: 0,
                bath: 0,
                washingMachine: 0,
                dishWasher: 0,
                showerCabin: 0,
            },
        });
        expect(result.success).toBe(true);
    });

    it('depthWaterSource опционален', () => {
        expect(realEstateSchema.safeParse({ ...VALID, depthWaterSource: 25 }).success).toBe(true);
        expect(realEstateSchema.safeParse(VALID).success).toBe(true);
    });
});
