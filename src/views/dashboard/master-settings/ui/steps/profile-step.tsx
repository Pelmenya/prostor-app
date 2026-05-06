'use client';

import { forwardRef, useImperativeHandle } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCurrentUserSuspense, useUpdateProfile } from '@/entities/user';
import { normalizeRuPhone, formatRuPhoneForView, denormalizeViewToE164 } from '@/shared/lib';
import { InputField } from '@/shared/ui';

const phoneE164Ru = /^\+7\d{10}$/;

const schema = z.object({
    first_name: z.string().min(1, 'Имя обязательно'),
    last_name: z.string().min(1, 'Фамилия обязательна'),
    phone: z.string().regex(phoneE164Ru, 'Формат: +7 999 999-99-99'),
});

type TProfileForm = z.infer<typeof schema>;

export type TProfileStepHandle = {
    submit: () => Promise<boolean>;
};

function capitalizeName(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export const ProfileStep = forwardRef<TProfileStepHandle>(function ProfileStep(_, ref) {
    const { data: user } = useCurrentUserSuspense();
    const { mutateAsync } = useUpdateProfile();

    const {
        register,
        handleSubmit,
        control,
        trigger,
        formState: { errors, isSubmitted },
    } = useForm<TProfileForm>({
        resolver: zodResolver(schema),
        defaultValues: {
            first_name: capitalizeName(user?.first_name ?? ''),
            last_name: capitalizeName(user?.last_name ?? ''),
            phone: user?.phone ? denormalizeViewToE164(user.phone) : '',
        },
    });

    useImperativeHandle(ref, () => ({
        submit: () =>
            new Promise<boolean>((resolve) => {
                void handleSubmit(
                    async (data) => {
                        try {
                            await mutateAsync(data);
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
            <h2 className="text-xl font-bold">Профиль</h2>
            <p className="text-sm text-base-content/60">Укажите ваше имя и контактный телефон.</p>

            <InputField label="Имя" error={errors.first_name?.message}>
                <input
                    type="text"
                    placeholder="Имя"
                    className={`input input-bordered w-full ${errors.first_name ? 'input-error' : ''}`}
                    {...register('first_name')}
                    onInput={(e) => {
                        const val = capitalizeName(e.currentTarget.value);
                        e.currentTarget.value = val;
                    }}
                />
            </InputField>

            <InputField label="Фамилия" error={errors.last_name?.message}>
                <input
                    type="text"
                    placeholder="Фамилия"
                    className={`input input-bordered w-full ${errors.last_name ? 'input-error' : ''}`}
                    {...register('last_name')}
                    onInput={(e) => {
                        const val = capitalizeName(e.currentTarget.value);
                        e.currentTarget.value = val;
                    }}
                />
            </InputField>

            <InputField label="Телефон" error={errors.phone?.message}>
                <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                        <input
                            type="tel"
                            placeholder="+7 999 999-99-99"
                            className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`}
                            value={formatRuPhoneForView(normalizeRuPhone(field.value ?? ''))}
                            onChange={(e) => field.onChange(denormalizeViewToE164(e.target.value))}
                            onPaste={(e) => {
                                e.preventDefault();
                                const text = e.clipboardData.getData('text');
                                field.onChange(
                                    denormalizeViewToE164(
                                        formatRuPhoneForView(normalizeRuPhone(text)),
                                    ),
                                );
                                if (isSubmitted) setTimeout(() => void trigger('phone'), 0);
                            }}
                            inputMode="tel"
                            maxLength={18}
                        />
                    )}
                />
            </InputField>
        </div>
    );
});
