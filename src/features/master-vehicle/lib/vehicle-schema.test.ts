import { describe, it, expect } from 'vitest';
import { vehicleSchema } from './vehicle-schema';

describe('vehicleSchema', () => {
    it('принимает все пустые строки', () => {
        const result = vehicleSchema.safeParse({
            carModel: '',
            carNumber: '',
            maxCargoLength: '',
            maxCargoWidth: '',
            maxCargoHeight: '',
            maxCargoWeight: '',
        });
        expect(result.success).toBe(true);
    });

    it('принимает валидные данные', () => {
        const result = vehicleSchema.safeParse({
            carModel: 'Toyota Hiace',
            carNumber: 'А123БВ77',
            maxCargoLength: '200',
            maxCargoWidth: '150',
            maxCargoHeight: '140',
            maxCargoWeight: '500',
        });
        expect(result.success).toBe(true);
    });

    it('обрезает пробелы в carModel', () => {
        const result = vehicleSchema.safeParse({
            carModel: '  Toyota  ',
            carNumber: '',
            maxCargoLength: '',
            maxCargoWidth: '',
            maxCargoHeight: '',
            maxCargoWeight: '',
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.carModel).toBe('Toyota');
        }
    });

    it('обрезает пробелы в carNumber', () => {
        const result = vehicleSchema.safeParse({
            carModel: '',
            carNumber: '  А123БВ77  ',
            maxCargoLength: '',
            maxCargoWidth: '',
            maxCargoHeight: '',
            maxCargoWeight: '',
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.carNumber).toBe('А123БВ77');
        }
    });
});
