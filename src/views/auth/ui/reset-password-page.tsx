'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPassword, newPasswordSchema, type TNewPasswordForm } from '@/features/auth';
import { ApiError } from '@/shared/api';
import { extractErrorMessage } from '@/shared/lib';
import { PageContainer, FormField } from '@/shared/ui';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<TNewPasswordForm>({
        resolver: zodResolver(newPasswordSchema),
        defaultValues: { password: '', confirmPassword: '' },
    });

    if (!token) {
        return (
            <div className="card bg-base-200 shadow-xl w-full max-w-md">
                <div className="card-body">
                    <div className="alert alert-error text-sm">
                        Недействительная ссылка. Запросите сброс пароля заново.
                    </div>
                    <Link href="/forgot-password" className="btn btn-primary w-full mt-4">
                        Запросить сброс пароля
                    </Link>
                </div>
            </div>
        );
    }

    const onSubmit = async (form: TNewPasswordForm) => {
        setServerError(null);
        try {
            await resetPassword(token, form.password);
            setSuccess(true);
        } catch (err) {
            if (err instanceof ApiError) {
                setServerError(extractErrorMessage(err.data, 'Ссылка недействительна или истекла'));
            } else {
                setServerError('Ошибка сети');
            }
        }
    };

    if (success) {
        return (
            <div className="card bg-base-200 shadow-xl w-full max-w-md">
                <div className="card-body">
                    <h1 className="card-title text-2xl gradient-text">Пароль обновлён</h1>
                    <div className="alert alert-success text-sm mt-4">
                        Пароль успешно изменён. Теперь вы можете войти с новым паролем.
                    </div>
                    <button
                        className="btn btn-primary w-full mt-4"
                        onClick={() => router.push('/login')}
                    >
                        Войти
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-200 shadow-xl w-full max-w-md">
            <div className="card-body">
                <h1 className="card-title text-2xl gradient-text">Новый пароль</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-4">
                    <FormField label="Новый пароль" error={errors.password?.message}>
                        <input
                            type="password"
                            className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
                            placeholder="Минимум 8 символов"
                            {...register('password')}
                        />
                    </FormField>

                    <FormField label="Подтвердите пароль" error={errors.confirmPassword?.message}>
                        <input
                            type="password"
                            className={`input input-bordered w-full ${errors.confirmPassword ? 'input-error' : ''}`}
                            placeholder="Повторите пароль"
                            {...register('confirmPassword')}
                        />
                    </FormField>

                    {serverError && <div className="alert alert-error text-sm">{serverError}</div>}

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="loading loading-spinner loading-sm" />
                        ) : (
                            'Установить пароль'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export function ResetPasswordPage() {
    return (
        <PageContainer>
            <div className="flex items-center justify-center min-h-[60vh]">
                <Suspense fallback={<span className="loading loading-spinner loading-lg" />}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </PageContainer>
    );
}
