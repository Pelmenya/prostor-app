'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { webLogin, loginSchema, type TLoginForm } from '@/features/auth';
import { ApiError, resetSessionExpiredNotified } from '@/shared/api';
import {
    useAuthStore,
    extractErrorMessage,
    getSafeRedirect,
    useFormDraft,
    getFormDraft,
} from '@/shared/lib';
import { PageContainer, FormField } from '@/shared/ui';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setTokens, setUser } = useAuthStore();
    const [serverError, setServerError] = useState<string | null>(null);

    const loginDraft = getFormDraft<TLoginForm>('login-form-draft');
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<TLoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: loginDraft?.email ?? '', password: '' },
    });

    const { clearDraft } = useFormDraft('login-form-draft', watch, { exclude: ['password'] });

    const onSubmit = async (form: TLoginForm) => {
        setServerError(null);
        try {
            const data = await webLogin(form);
            clearDraft();
            setTokens(data.accessToken, data.refreshToken);
            setUser(data.user);
            resetSessionExpiredNotified();
            router.push(getSafeRedirect(searchParams.get('from')));
        } catch (err) {
            if (err instanceof ApiError) {
                setServerError(extractErrorMessage(err.data, 'Неверный email или пароль'));
            } else {
                setServerError('Ошибка сети');
            }
        }
    };

    return (
        <div className="card bg-base-200 shadow-xl w-full max-w-md">
            <div className="card-body">
                <h1 className="card-title text-2xl gradient-text">Вход</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-4">
                    <FormField label="Email" error={errors.email?.message}>
                        <input
                            type="email"
                            className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                            placeholder="Email"
                            {...register('email')}
                        />
                    </FormField>

                    <FormField label="Пароль" error={errors.password?.message}>
                        <input
                            type="password"
                            className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
                            placeholder="Пароль"
                            {...register('password')}
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
                            'Войти'
                        )}
                    </button>
                </form>

                <div className="flex flex-col items-center gap-2 mt-4 text-sm">
                    <p>
                        Нет аккаунта?{' '}
                        <Link href="/register" className="link link-primary">
                            Зарегистрироваться
                        </Link>
                    </p>
                    <p>
                        Забыли пароль?{' '}
                        <Link href="/forgot-password" className="link link-primary">
                            Восстановить
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export function LoginPage() {
    return (
        <PageContainer>
            <div className="flex items-center justify-center min-h-[60vh]">
                <Suspense fallback={<span className="loading loading-spinner loading-lg" />}>
                    <LoginForm />
                </Suspense>
            </div>
        </PageContainer>
    );
}
