'use client';

import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { normalizeRuPhone, formatRuPhoneForView, denormalizeViewToE164 } from '@/shared/lib';
import { FormCard, InputField } from '@/shared/ui';
import type { TUser } from '@/shared/model';

const phoneE164Ru = /^\+7\d{10}$/;

const schema = z.object({
    first_name: z.string().min(1, 'Имя обязательно'),
    last_name: z.string().min(1, 'Фамилия обязательна'),
    phone: z.string().regex(phoneE164Ru, 'Формат: +7 999 999-99-99'),
});

export type TProfileFormData = z.infer<typeof schema>;

export type TProfileFormHandle = {
    submit: () => Promise<boolean>;
};

type TProfileFormProps = {
    user: TUser | null;
    onSubmit: (data: TProfileFormData) => void | Promise<void>;
    isLoading?: boolean;
    hideSubmit?: boolean;
};

function capitalizeName(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export const ProfileForm = forwardRef<TProfileFormHandle, TProfileFormProps>(function ProfileForm(
    { user, onSubmit, isLoading = false, hideSubmit = false },
    ref,
) {
    const {
        register,
        handleSubmit,
        setValue,
        control,
        trigger,
        reset,
        formState: { errors, isSubmitted },
    } = useForm<TProfileFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            first_name: capitalizeName(user?.first_name ?? ''),
            last_name: capitalizeName(user?.last_name ?? ''),
            phone: user?.phone ? denormalizeViewToE164(user.phone) : '',
        },
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    });

    useEffect(() => {
        if (!user) return;
        reset({
            first_name: capitalizeName(user.first_name ?? ''),
            last_name: capitalizeName(user.last_name ?? ''),
            phone: user.phone ? denormalizeViewToE164(user.phone) : '',
        });
    }, [user, reset]);

    useImperativeHandle(ref, () => ({
        submit: () =>
            new Promise<boolean>((resolve) => {
                void handleSubmit(
                    async (data) => {
                        try {
                            await Promise.resolve(onSubmit(data));
                            resolve(true);
                        } catch {
                            resolve(false);
                        }
                    },
                    () => resolve(false),
                )();
            }),
    }));

    const nameInputHandler =
        (field: 'first_name' | 'last_name') => (e: React.FormEvent<HTMLInputElement>) => {
            setValue(field, capitalizeName(e.currentTarget.value), {
                shouldDirty: true,
                shouldValidate: isSubmitted,
            });
        };

    return (
        <FormCard
            onSubmit={handleSubmit(onSubmit)}
            submitText="Сохранить"
            isLoading={isLoading}
            hideSubmit={hideSubmit}
        >
            <InputField label="Ваше имя" error={errors.first_name?.message}>
                <input
                    type="text"
                    placeholder="Имя"
                    className={`input input-sm w-full ${errors.first_name ? 'input-error' : ''}`}
                    {...register('first_name')}
                    onInput={nameInputHandler('first_name')}
                />
            </InputField>

            <InputField label="Ваша фамилия" error={errors.last_name?.message}>
                <input
                    type="text"
                    placeholder="Фамилия"
                    className={`input input-sm w-full ${errors.last_name ? 'input-error' : ''}`}
                    {...register('last_name')}
                    onInput={nameInputHandler('last_name')}
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
                            className={`input input-sm w-full ${errors.phone ? 'input-error' : ''}`}
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
        </FormCard>
    );
});
