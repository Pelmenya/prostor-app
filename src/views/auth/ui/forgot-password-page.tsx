'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPassword, forgotPasswordSchema, type TForgotPasswordForm } from '@/features/auth';
import { ApiError } from '@/shared/api';
import { extractErrorMessage } from '@/shared/lib';
import { PageContainer, FormField } from '@/shared/ui';

export function ForgotPasswordPage() {
    const [serverError, setServerError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<TForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    });

    const onSubmit = async (form: TForgotPasswordForm) => {
        setServerError(null);
        try {
            await forgotPassword(form.email);
        } catch (err) {
            if (err instanceof ApiError) {
                // Rate limit — показываем, остальные 4xx скрываем (OWASP A07)
                if (err.status === 400) {
                    setServerError(extractErrorMessage(err.data, ''));
                    return;
                }
            } else {
                setServerError('Ошибка сети');
                return;
            }
        }
        setSent(true);
    };

    return (
        <PageContainer>
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="card bg-base-200 shadow-xl w-full max-w-md">
                    <div className="card-body">
                        <h1 className="card-title text-2xl gradient-text">Восстановление пароля</h1>

                        {sent ? (
                            <div className="flex flex-col gap-4 mt-4">
                                <div className="alert alert-success text-sm">
                                    Мы отправили ссылку для сброса пароля. Проверьте почту
                                </div>
                                <p className="text-xs text-base-content/50">
                                    Письмо не пришло? Проверьте папку «Спам». Если письма нет —
                                    попробуйте другую почту (Gmail, Яндекс)
                                </p>
                                <Link href="/login" className="btn btn-primary w-full">
                                    Вернуться ко входу
                                </Link>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-base-content/70 mt-2">
                                    Укажите email, на который зарегистрирован аккаунт
                                </p>

                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="flex flex-col gap-4 mt-4"
                                >
                                    <FormField label="Email" error={errors.email?.message}>
                                        <input
                                            type="email"
                                            className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                                            placeholder="Email"
                                            {...register('email')}
                                        />
                                    </FormField>

                                    {serverError && (
                                        <div className="alert alert-error text-sm">
                                            {serverError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-full"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <span className="loading loading-spinner loading-sm" />
                                        ) : (
                                            'Отправить ссылку'
                                        )}
                                    </button>
                                </form>

                                <p className="text-center text-sm mt-4">
                                    Вспомнили пароль?{' '}
                                    <Link href="/login" className="link link-primary">
                                        Войти
                                    </Link>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
