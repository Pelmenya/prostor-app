'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore, extractErrorMessage } from '@/shared/lib';
import { PageContainer, PageTitle, FormCard, InputField } from '@/shared/ui';
import { changePassword, newPasswordSchema, type TChangePasswordForm } from '@/features/auth';
import { ApiError } from '@/shared/api';

export function ChangePasswordPage() {
    const accessToken = useAuthStore((s) => s.accessToken);
    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TChangePasswordForm>({
        resolver: zodResolver(newPasswordSchema),
        defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
    });

    const onSubmit = async (form: TChangePasswordForm) => {
        if (!accessToken) return;
        setServerError(null);
        setSuccess(false);
        try {
            await changePassword(accessToken, {
                oldPassword: form.oldPassword,
                newPassword: form.newPassword,
            });
            setSuccess(true);
            reset();
        } catch (err) {
            if (err instanceof ApiError) {
                setServerError(extractErrorMessage(err.data, 'Ошибка смены пароля'));
            } else {
                setServerError('Ошибка сети');
            }
        }
    };

    return (
        <PageContainer>
            <div className="flex flex-col gap-4">
                <PageTitle>Смена пароля</PageTitle>

                <FormCard
                    onSubmit={handleSubmit(onSubmit)}
                    submitText="Изменить пароль"
                    isLoading={isSubmitting}
                >
                    <InputField label="Текущий пароль" error={errors.oldPassword?.message}>
                        <input
                            type="password"
                            placeholder="Введите текущий пароль"
                            className={`input input-sm w-full ${errors.oldPassword ? 'input-error' : ''}`}
                            {...register('oldPassword')}
                        />
                    </InputField>

                    <InputField label="Новый пароль" error={errors.newPassword?.message}>
                        <input
                            type="password"
                            placeholder="Минимум 8 символов"
                            className={`input input-sm w-full ${errors.newPassword ? 'input-error' : ''}`}
                            {...register('newPassword')}
                        />
                    </InputField>

                    <InputField label="Подтвердите пароль" error={errors.confirmPassword?.message}>
                        <input
                            type="password"
                            placeholder="Повторите новый пароль"
                            className={`input input-sm w-full ${errors.confirmPassword ? 'input-error' : ''}`}
                            {...register('confirmPassword')}
                        />
                    </InputField>

                    {serverError && <div className="alert alert-error text-sm">{serverError}</div>}
                    {success && (
                        <div className="alert alert-success text-sm">Пароль успешно изменён</div>
                    )}
                </FormCard>
            </div>
        </PageContainer>
    );
}
