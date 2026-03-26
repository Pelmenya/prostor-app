'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { webRegister } from '@/features/auth';
import { PageContainer } from '@/shared/ui';

function RegisterVerifyEmailContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email') ?? '';
    const [resent, setResent] = useState(false);
    const [sending, setSending] = useState(false);

    const handleResend = async () => {
        if (!email) return;
        setSending(true);
        try {
            // webRegister с тем же email → бэк вернёт 409 и отправит verification заново
            await webRegister({
                first_name: '',
                last_name: '',
                email,
                phone: '',
                password: 'placeholder',
                policyVersion: '',
                pdAgreementVersion: '',
            });
        } catch {
            // 409 ожидаем — письмо отправлено
        }
        setSending(false);
        setResent(true);
    };

    return (
        <div className="card bg-base-200 shadow-xl w-full max-w-md">
            <div className="card-body items-center text-center">
                <div className="text-5xl mb-4">✉️</div>
                <h1 className="card-title text-2xl gradient-text">Подтвердите email</h1>

                <p className="text-sm text-base-content/70 mt-2">
                    Аккаунт с email
                    {email && (
                        <>
                            {' '}
                            <strong>{email}</strong>
                        </>
                    )}{' '}
                    уже существует. Мы отправили письмо для подтверждения.
                </p>

                <p className="text-sm text-base-content/70 mt-2">
                    После подтверждения перейдите на страницу привязки аккаунта, чтобы установить
                    пароль для входа через веб
                </p>

                <p className="text-xs text-base-content/50 mt-2">
                    Письмо не пришло? Проверьте папку «Спам». Если письма нет — попробуйте другую
                    почту (Gmail, Яндекс)
                </p>

                {resent ? (
                    <div className="alert alert-success text-sm mt-4">
                        Письмо отправлено повторно
                    </div>
                ) : (
                    <button
                        className="btn btn-outline btn-sm mt-4"
                        onClick={handleResend}
                        disabled={sending || !email}
                    >
                        {sending ? (
                            <span className="loading loading-spinner loading-sm" />
                        ) : (
                            'Отправить повторно'
                        )}
                    </button>
                )}

                <div className="flex flex-col gap-2 w-full mt-4">
                    <Link
                        href={`/link-account${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                        className="btn btn-primary w-full"
                    >
                        Привязать аккаунт
                    </Link>
                    <Link href="/login" className="link link-primary text-sm">
                        Войти в существующий аккаунт
                    </Link>
                </div>
            </div>
        </div>
    );
}

export function RegisterVerifyEmailPage() {
    return (
        <PageContainer>
            <div className="flex items-center justify-center min-h-[60vh]">
                <Suspense fallback={<span className="loading loading-spinner loading-lg" />}>
                    <RegisterVerifyEmailContent />
                </Suspense>
            </div>
        </PageContainer>
    );
}
