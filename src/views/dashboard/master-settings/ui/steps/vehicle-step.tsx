'use client';

import { forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAccountService, useUpdateAccountService } from '@/entities/account-service';
import { FormField } from '@/shared/ui';

const vehicleSchema = z.object({
    carModel: z.string().trim(),
    carNumber: z.string().trim(),
    maxCargoLength: z.string(),
    maxCargoWidth: z.string(),
    maxCargoHeight: z.string(),
    maxCargoWeight: z.string(),
});

type TVehicleForm = z.infer<typeof vehicleSchema>;

function toOptionalInt(val: string): number | undefined {
    if (!val) return undefined;
    const n = parseInt(val, 10);
    return isNaN(n) || n < 1 ? undefined : n;
}

export type TVehicleStepHandle = {
    submit: () => Promise<boolean>;
};

export const VehicleStep = forwardRef<TVehicleStepHandle>(function VehicleStep(_, ref) {
    const { data: accountService } = useAccountService();
    const { mutateAsync } = useUpdateAccountService();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<TVehicleForm>({
        resolver: zodResolver(vehicleSchema),
        defaultValues: {
            carModel: accountService?.carModel ?? '',
            carNumber: accountService?.carNumber ?? '',
            maxCargoLength: accountService?.maxCargoLength?.toString() ?? '',
            maxCargoWidth: accountService?.maxCargoWidth?.toString() ?? '',
            maxCargoHeight: accountService?.maxCargoHeight?.toString() ?? '',
            maxCargoWeight: accountService?.maxCargoWeight?.toString() ?? '',
        },
    });

    useImperativeHandle(ref, () => ({
        submit: () =>
            new Promise<boolean>((resolve) => {
                void handleSubmit(
                    async (data) => {
                        try {
                            await mutateAsync({
                                carModel: data.carModel || undefined,
                                carNumber: data.carNumber || undefined,
                                maxCargoLength: toOptionalInt(data.maxCargoLength),
                                maxCargoWidth: toOptionalInt(data.maxCargoWidth),
                                maxCargoHeight: toOptionalInt(data.maxCargoHeight),
                                maxCargoWeight: toOptionalInt(data.maxCargoWeight),
                            });
                            resolve(true);
                        } catch {
                            resolve(false);
                        }
                    },
                    () => resolve(false),
                )();
            }),
    }));

    return (
        <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
            <h2 className="text-xl font-bold">Автомобиль</h2>
            <p className="text-sm text-base-content/60">
                Укажите данные вашего рабочего автомобиля.
            </p>

            <FormField label="Модель автомобиля" error={errors.carModel?.message}>
                <input
                    type="text"
                    className={`input input-bordered w-full ${errors.carModel ? 'input-error' : ''}`}
                    placeholder="Например: Toyota Hiace"
                    {...register('carModel')}
                />
            </FormField>

            <FormField label="Государственный номер" error={errors.carNumber?.message}>
                <input
                    type="text"
                    className={`input input-bordered w-full ${errors.carNumber ? 'input-error' : ''}`}
                    placeholder="Например: А123БВ77"
                    {...register('carNumber')}
                />
            </FormField>

            <div className="divider text-sm text-base-content/50">Грузовой отсек</div>

            <div className="grid grid-cols-2 gap-4">
                <FormField label="Длина, см" error={errors.maxCargoLength?.message}>
                    <input
                        type="number"
                        min={1}
                        className={`input input-bordered w-full ${errors.maxCargoLength ? 'input-error' : ''}`}
                        placeholder="200"
                        {...register('maxCargoLength')}
                    />
                </FormField>

                <FormField label="Ширина, см" error={errors.maxCargoWidth?.message}>
                    <input
                        type="number"
                        min={1}
                        className={`input input-bordered w-full ${errors.maxCargoWidth ? 'input-error' : ''}`}
                        placeholder="150"
                        {...register('maxCargoWidth')}
                    />
                </FormField>

                <FormField label="Высота, см" error={errors.maxCargoHeight?.message}>
                    <input
                        type="number"
                        min={1}
                        className={`input input-bordered w-full ${errors.maxCargoHeight ? 'input-error' : ''}`}
                        placeholder="140"
                        {...register('maxCargoHeight')}
                    />
                </FormField>

                <FormField label="Макс. вес, кг" error={errors.maxCargoWeight?.message}>
                    <input
                        type="number"
                        min={1}
                        className={`input input-bordered w-full ${errors.maxCargoWeight ? 'input-error' : ''}`}
                        placeholder="500"
                        {...register('maxCargoWeight')}
                    />
                </FormField>
            </div>
        </div>
    );
});
