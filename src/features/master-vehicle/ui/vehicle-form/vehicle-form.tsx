'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateAccountService } from '@/entities/account-service';
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

type TVehicleFormProps = {
    initialData?: {
        carModel?: string | null;
        carNumber?: string | null;
        maxCargoLength?: number | null;
        maxCargoWidth?: number | null;
        maxCargoHeight?: number | null;
        maxCargoWeight?: number | null;
    } | null;
};

function toOptionalInt(val: string): number | undefined {
    if (!val) return undefined;
    const n = parseInt(val, 10);
    return isNaN(n) || n < 1 ? undefined : n;
}

export function VehicleForm({ initialData }: TVehicleFormProps) {
    const router = useRouter();
    const { mutate, isPending, error } = useUpdateAccountService();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<TVehicleForm>({
        resolver: zodResolver(vehicleSchema),
        defaultValues: {
            carModel: initialData?.carModel ?? '',
            carNumber: initialData?.carNumber ?? '',
            maxCargoLength: initialData?.maxCargoLength?.toString() ?? '',
            maxCargoWidth: initialData?.maxCargoWidth?.toString() ?? '',
            maxCargoHeight: initialData?.maxCargoHeight?.toString() ?? '',
            maxCargoWeight: initialData?.maxCargoWeight?.toString() ?? '',
        },
    });

    function onSubmit(form: TVehicleForm) {
        mutate(
            {
                carModel: form.carModel || undefined,
                carNumber: form.carNumber || undefined,
                maxCargoLength: toOptionalInt(form.maxCargoLength),
                maxCargoWidth: toOptionalInt(form.maxCargoWidth),
                maxCargoHeight: toOptionalInt(form.maxCargoHeight),
                maxCargoWeight: toOptionalInt(form.maxCargoWeight),
            },
            { onSuccess: () => router.back() },
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

            {error && (
                <p className="text-error text-sm">Не удалось сохранить. Попробуйте ещё раз.</p>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={isPending}>
                {isPending ? <span className="loading loading-spinner loading-sm" /> : 'Сохранить'}
            </button>
        </form>
    );
}
