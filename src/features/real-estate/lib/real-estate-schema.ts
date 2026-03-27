import { z } from 'zod';
import { REAL_ESTATE_TYPES, WATER_SOURCES } from '@/shared/model';
import type { TWaterIntakePoints } from '@/shared/model';

const MAX_INTAKE = 99;

const waterIntakePointsSchema = z.object({
    toilet: z.number().min(0).max(MAX_INTAKE),
    sink: z.number().min(0).max(MAX_INTAKE),
    bath: z.number().min(0).max(MAX_INTAKE),
    washingMachine: z.number().min(0).max(MAX_INTAKE),
    dishWasher: z.number().min(0).max(MAX_INTAKE),
    showerCabin: z.number().min(0).max(MAX_INTAKE),
}) satisfies z.ZodType<TWaterIntakePoints>;

export const realEstateSchema = z.object({
    address: z.string().min(1, 'Введите адрес'),
    activeType: z.enum(REAL_ESTATE_TYPES, {
        message: 'Выберите тип объекта',
    }),
    residents: z.number().min(1, 'Минимум 1 житель').max(50, 'Максимум 50 жителей'),
    activeSource: z.enum(WATER_SOURCES, {
        message: 'Выберите источник воды',
    }),
    depthWaterSource: z.number().min(0).optional(),
    waterIntakePoints: waterIntakePointsSchema,
});

export type TRealEstateForm = z.infer<typeof realEstateSchema>;

export const DEFAULT_WATER_INTAKE: TRealEstateForm['waterIntakePoints'] = {
    toilet: 1,
    sink: 1,
    bath: 1,
    washingMachine: 1,
    dishWasher: 0,
    showerCabin: 0,
};

export const DEFAULT_FORM_VALUES: TRealEstateForm = {
    address: '',
    activeType: 'apartment',
    residents: 2,
    activeSource: 'waterSupply',
    waterIntakePoints: DEFAULT_WATER_INTAKE,
};
