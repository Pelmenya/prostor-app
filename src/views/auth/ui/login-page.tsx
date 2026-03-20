'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { webLogin } from '@/features/auth';
import { ApiError } from '@/shared/api';
import { useAuthStore } from '@/shared/lib/auth';
import { PageContainer } from '@/shared/ui';

const loginSchema = z.object({
    email: z.string().email('Неверный формат email'),
    password: z.string().min(1, 'Введите пароль'),
});

type TLoginForm = z.infer<typeof loginSchema>;

function getSafeRedirect(from: string | null): string {
    if (!from) return '/';
    if (!from.startsWith('/') || from.startsWith('//')) return '/';
    return from;
}

function extractErrorMessage(data: unknown, fallback: string): string {
    if (!data || typeof data !== 'object') return fallback;
    const d = data as Record<string, unknown>;
    if (typeof d.message === 'string') return d.message;
    if (Array.isArray(d.message) && d.message.length > 0) {
        return typeof d.message[0] === 'string' ? d.message[0] : fallback;
    }
    return fallback;
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setTokens, setUser } = useAuthStore();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<TLoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (form: TLoginForm) => {
        setServerError(null);
        try {
            const data = await webLogin(form);
            setTokens(data.accessToken, data.refreshToken);
            setUser(data.user);
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
                    <div className="form-control">
                        <label className="floating-label">
                            <span>Email</span>
                            <input
                                type="email"
                                className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                                placeholder="Email"
                                {...register('email')}
                            />
                        </label>
                        {errors.email && (
                            <p className="text-error text-xs mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="form-control">
                        <label className="floating-label">
                            <span>Пароль</span>
                            <input
                                type="password"
                                className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
                                placeholder="Пароль"
                                {...register('password')}
                            />
                        </label>
                        {errors.password && (
                            <p className="text-error text-xs mt-1">{errors.password.message}</p>
                        )}
                    </div>

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

                <p className="text-center text-sm mt-4">
                    Нет аккаунта?{' '}
                    <Link href="/register" className="link link-primary">
                        Зарегистрироваться
                    </Link>
                </p>
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
