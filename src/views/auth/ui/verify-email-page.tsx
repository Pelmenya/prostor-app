'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { verifyEmail, fetchCurrentUser } from '@/features/auth';
import { useAuthStore } from '@/shared/lib';
import { PageContainer } from '@/shared/ui';

type TVerifyStatus = 'loading' | 'verified' | 'changed' | 'error';

const STATUS_CONFIG = {
    verified: {
        title: 'Почта подтверждена',
        description:
            'Теперь вы будете получать уведомления о заказах и напоминания о замене картриджей.',
        linkHref: '/catalog',
        linkText: 'Перейти в каталог',
    },
    changed: {
        title: 'Email изменён',
        description: 'Новый email успешно привязан к вашему аккаунту.',
        linkHref: '/profile',
        linkText: 'В личный кабинет',
    },
} as const;

function VerifyEmailForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const queryClient = useQueryClient();

    const [status, setStatus] = useState<TVerifyStatus>(token ? 'loading' : 'error');
    const [errorMessage, setErrorMessage] = useState(token ? '' : 'Недействительная ссылка');
    const hasCalledRef = useRef(false);

    useEffect(() => {
        if (!token || hasCalledRef.current) return;
        hasCalledRef.current = true;

        const run = async () => {
            try {
                const res = await verifyEmail(token);

                if (res?.emailChanged) {
                    const accessToken = useAuthStore.getState().accessToken;
                    if (accessToken) {
                        try {
                            const user = await fetchCurrentUser(accessToken);
                            useAuthStore.getState().setUser(user);
                            queryClient.setQueryData(['user', 'me'], user);
                        } catch {
                            // Не критично — при следующем запросе подтянется
                        }
                    }
                    setStatus('changed');
                } else {
                    setStatus('verified');
                }
            } catch {
                setStatus('error');
                setErrorMessage('Ссылка недействительна или истекла');
            }
        };

        run();
    }, [token, queryClient]);

    return (
        <div className="card bg-base-200 shadow-xl w-full max-w-md">
            <div className="card-body items-center text-center">
                {status === 'loading' && (
                    <>
                        <span className="loading loading-spinner loading-lg text-primary" />
                        <p className="text-sm mt-4">Подтверждаем email...</p>
                    </>
                )}

                {(status === 'verified' || status === 'changed') && (
                    <>
                        <div className="text-5xl mb-4">✅</div>
                        <h1 className="card-title text-2xl gradient-text">
                            {STATUS_CONFIG[status].title}
                        </h1>
                        <p className="text-sm text-base-content/70 mt-2">
                            {STATUS_CONFIG[status].description}
                        </p>
                        <Link
                            href={STATUS_CONFIG[status].linkHref}
                            className="btn btn-primary w-full mt-4"
                        >
                            {STATUS_CONFIG[status].linkText}
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-5xl mb-4">❌</div>
                        <h1 className="card-title text-2xl">Ошибка</h1>
                        <div className="alert alert-error text-sm mt-4">{errorMessage}</div>
                        <Link href="/login" className="btn btn-primary w-full mt-4">
                            Войти
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}

export function VerifyEmailPage() {
    return (
        <PageContainer>
            <div className="flex items-center justify-center min-h-[60vh]">
                <Suspense fallback={<span className="loading loading-spinner loading-lg" />}>
                    <VerifyEmailForm />
                </Suspense>
            </div>
        </PageContainer>
    );
}
