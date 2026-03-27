import { z } from 'zod';

export const realEstateSchema = z.object({
    address: z.string().min(1, 'Введите адрес'),
    activeType: z.enum(['house', 'apartment', 'prom'], {
        message: 'Выберите тип объекта',
    }),
    residents: z.number().min(1, 'Минимум 1 житель').max(50, 'Максимум 50 жителей'),
    activeSource: z.enum(['borehole', 'well', 'reservoir', 'waterSupply'], {
        message: 'Выберите источник воды',
    }),
    depthWaterSource: z.number().min(0).optional(),
    waterIntakePoints: z.object({
        toilet: z.number().min(0),
        sink: z.number().min(0),
        bath: z.number().min(0),
        washingMachine: z.number().min(0),
        dishWasher: z.number().min(0),
        showerCabin: z.number().min(0),
    }),
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
