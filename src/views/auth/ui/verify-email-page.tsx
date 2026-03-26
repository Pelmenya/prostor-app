'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { verifyEmail } from '@/features/auth';
import { apiClient } from '@/shared/api';
import { useAuthStore } from '@/shared/lib';
import { PageContainer } from '@/shared/ui';
import type { TUser } from '@/shared/model';

type TVerifyStatus = 'loading' | 'verified' | 'changed' | 'error';

/** После смены email — обновить Zustand store и инвалидировать TQ кэш */
async function refreshUserData(queryClient: ReturnType<typeof useQueryClient>) {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) return;

    try {
        const user = await apiClient<TUser>('/auth/me', {
            auth: `Bearer ${accessToken}`,
        });
        useAuthStore.getState().setUser(user);
        queryClient.invalidateQueries({ queryKey: ['user'] });
    } catch {
        // Не критично — при следующем запросе подтянется
    }
}

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
                    await refreshUserData(queryClient);
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

                {status === 'verified' && (
                    <>
                        <div className="text-5xl mb-4">✅</div>
                        <h1 className="card-title text-2xl gradient-text">Email подтверждён</h1>
                        <p className="text-sm text-base-content/70 mt-2">
                            Теперь вы будете получать уведомления о заказах и напоминания о замене
                            картриджей.
                        </p>
                        <Link href="/catalog" className="btn btn-primary w-full mt-4">
                            Перейти в каталог
                        </Link>
                    </>
                )}

                {status === 'changed' && (
                    <>
                        <div className="text-5xl mb-4">✅</div>
                        <h1 className="card-title text-2xl gradient-text">Email изменён</h1>
                        <p className="text-sm text-base-content/70 mt-2">
                            Новый email успешно привязан к вашему аккаунту.
                        </p>
                        <Link href="/profile" className="btn btn-primary w-full mt-4">
                            В личный кабинет
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
