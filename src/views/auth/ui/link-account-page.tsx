'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { webRegister } from '@/features/auth';
import { ApiError } from '@/shared/api';
import { useAuthStore, extractErrorMessage, getSafeRedirect } from '@/shared/lib';
import { useCurrentPolicy } from '@/entities/privacy-policy';
import { useCurrentAgreement } from '@/entities/personal-data-agreement';
import { PageContainer, FormField } from '@/shared/ui';

const linkAccountSchema = z
    .object({
        password: z.string().min(8, 'Минимум 8 символов'),
        confirmPassword: z.string().min(1, 'Подтвердите пароль'),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmPassword'],
    });

type TLinkAccountForm = z.infer<typeof linkAccountSchema>;

function LinkAccountForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') ?? '';
    const { setTokens, setUser } = useAuthStore();

    const { data: currentPolicy } = useCurrentPolicy();
    const { data: currentAgreement } = useCurrentAgreement();

    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<TLinkAccountForm>({
        resolver: zodResolver(linkAccountSchema),
        defaultValues: { password: '', confirmPassword: '' },
    });

    if (!email) {
        return (
            <div className="card bg-base-200 shadow-xl w-full max-w-md">
                <div className="card-body">
                    <div className="alert alert-error text-sm">
                        Email не указан. Начните с регистрации.
                    </div>
                    <Link href="/register" className="btn btn-primary w-full mt-4">
                        Перейти к регистрации
                    </Link>
                </div>
            </div>
        );
    }

    const onSubmit = async (form: TLinkAccountForm) => {
        setServerError(null);

        if (!currentPolicy?.version || !currentAgreement?.version) {
            setServerError('Не удалось загрузить документы. Обновите страницу.');
            return;
        }

        try {
            const data = await webRegister({
                first_name: '',
                last_name: '',
                email,
                phone: '',
                password: form.password,
                policyVersion: currentPolicy.version,
                pdAgreementVersion: currentAgreement.version,
            });
            setTokens(data.accessToken, data.refreshToken);
            setUser(data.user);
            router.push(getSafeRedirect(searchParams.get('from')));
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.status === 409) {
                    setServerError('Email ещё не подтверждён. Проверьте почту');
                    return;
                }
                setServerError(extractErrorMessage(err.data, 'Ошибка привязки'));
            } else {
                setServerError('Ошибка сети');
            }
        }
    };

    return (
        <div className="card bg-base-200 shadow-xl w-full max-w-md">
            <div className="card-body">
                <h1 className="card-title text-2xl gradient-text">Привязка аккаунта</h1>

                <p className="text-sm text-base-content/70 mt-2">
                    Аккаунт <strong>{email}</strong> найден. Придумайте пароль для входа через веб
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-4">
                    <FormField label="Пароль" error={errors.password?.message}>
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
                            'Привязать и войти'
                        )}
                    </button>
                </form>

                <p className="text-center text-sm mt-4">
                    Уже есть пароль?{' '}
                    <Link href="/login" className="link link-primary">
                        Войти
                    </Link>
                </p>
            </div>
        </div>
    );
}

export function LinkAccountPage() {
    return (
        <PageContainer>
            <div className="flex items-center justify-center min-h-[60vh]">
                <Suspense fallback={<span className="loading loading-spinner loading-lg" />}>
                    <LinkAccountForm />
                </Suspense>
            </div>
        </PageContainer>
    );
}
