'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { webLogin } from '@/features/auth';
import { ApiError } from '@/shared/api';
import { useAuthStore } from '@/shared/lib/auth';
import { PageContainer } from '@/shared/ui';

function getSafeRedirect(from: string | null): string {
    if (!from) return '/';
    // Защита от open redirect: только относительные пути без //
    if (!from.startsWith('/') || from.startsWith('//')) return '/';
    return from;
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setTokens, setUser } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const data = await webLogin({ email, password });
            setTokens(data.accessToken, data.refreshToken);
            setUser(data.user);
            router.push(getSafeRedirect(searchParams.get('from')));
        } catch (err) {
            if (err instanceof ApiError) {
                setError(
                    (err.data as { message?: string })?.message || 'Неверный email или пароль',
                );
            } else {
                setError('Ошибка сети');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card bg-base-200 shadow-xl w-full max-w-md">
            <div className="card-body">
                <h1 className="card-title text-2xl gradient-text">Вход</h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
                    <label className="floating-label">
                        <span>Email</span>
                        <input
                            type="email"
                            className="input input-bordered w-full"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </label>

                    <label className="floating-label">
                        <span>Пароль</span>
                        <input
                            type="password"
                            className="input input-bordered w-full"
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>

                    {error && <div className="alert alert-error text-sm">{error}</div>}

                    <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                        {isLoading ? (
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
