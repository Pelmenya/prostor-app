'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyEmail } from '@/features/auth';
import { PageContainer } from '@/shared/ui';

function VerifyEmailForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
        token ? 'loading' : 'error',
    );
    const [errorMessage, setErrorMessage] = useState(token ? '' : 'Недействительная ссылка');

    useEffect(() => {
        if (!token) return;

        verifyEmail(token)
            .then(() => setStatus('success'))
            .catch(() => {
                setStatus('error');
                setErrorMessage('Ссылка недействительна или истекла');
            });
    }, [token]);

    return (
        <div className="card bg-base-200 shadow-xl w-full max-w-md">
            <div className="card-body items-center text-center">
                {status === 'loading' && (
                    <>
                        <span className="loading loading-spinner loading-lg text-primary" />
                        <p className="text-sm mt-4">Подтверждаем email...</p>
                    </>
                )}

                {status === 'success' && (
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
