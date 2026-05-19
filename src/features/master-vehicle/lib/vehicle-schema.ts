import { z } from 'zod';

export const vehicleSchema = z.object({
    carModel: z.string().trim(),
    carNumber: z.string().trim(),
    maxCargoLength: z.string(),
    maxCargoWidth: z.string(),
    maxCargoHeight: z.string(),
    maxCargoWeight: z.string(),
});

export type TVehicleFormValues = z.infer<typeof vehicleSchema>;
