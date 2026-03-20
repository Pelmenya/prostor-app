'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { webRegister } from '@/features/auth';
import { ApiError } from '@/shared/api';
import { useAuthStore } from '@/shared/lib/auth';
import { useCurrentPolicy } from '@/entities/privacy-policy';
import { PageContainer } from '@/shared/ui';
import { PrivacyPolicyModal } from './privacy-policy-modal';

export function RegisterPage() {
    const router = useRouter();
    const { setTokens, setUser } = useAuthStore();
    const {
        data: currentPolicy,
        isLoading: isPolicyLoading,
        isError: isPolicyError,
    } = useCurrentPolicy();

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
    });
    const [agree, setAgree] = useState(false);
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleAgreeFromModal = () => {
        setAgree(true);
        setIsPolicyModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (form.password.length < 8) {
            setError('Пароль должен содержать минимум 8 символов');
            return;
        }

        if (!agree) {
            setError('Необходимо согласие с политикой конфиденциальности');
            return;
        }

        if (!currentPolicy?.version) {
            setError('Не удалось загрузить политику конфиденциальности. Обновите страницу.');
            return;
        }

        setIsLoading(true);

        try {
            const data = await webRegister({
                ...form,
                policyVersion: currentPolicy.version,
            });
            setTokens(data.accessToken, data.refreshToken);
            setUser(data.user);
            router.push('/');
        } catch (err) {
            if (err instanceof ApiError) {
                setError((err.data as { message?: string })?.message || 'Ошибка регистрации');
            } else {
                setError('Ошибка сети');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageContainer>
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="card bg-base-200 shadow-xl w-full max-w-md">
                    <div className="card-body">
                        <h1 className="card-title text-2xl gradient-text">Регистрация</h1>

                        {isPolicyError && (
                            <div className="alert alert-error text-sm">
                                Не удалось загрузить политику конфиденциальности. Обновите страницу.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
                            <label className="floating-label">
                                <span>Имя</span>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    placeholder="Имя"
                                    value={form.first_name}
                                    onChange={update('first_name')}
                                    required
                                />
                            </label>

                            <label className="floating-label">
                                <span>Фамилия</span>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    placeholder="Фамилия"
                                    value={form.last_name}
                                    onChange={update('last_name')}
                                    required
                                />
                            </label>

                            <label className="floating-label">
                                <span>Email</span>
                                <input
                                    type="email"
                                    className="input input-bordered w-full"
                                    placeholder="Email"
                                    value={form.email}
                                    onChange={update('email')}
                                    required
                                />
                            </label>

                            <label className="floating-label">
                                <span>Телефон</span>
                                <input
                                    type="tel"
                                    className="input input-bordered w-full"
                                    placeholder="+79991234567"
                                    value={form.phone}
                                    onChange={update('phone')}
                                    required
                                />
                            </label>

                            <label className="floating-label">
                                <span>Пароль</span>
                                <input
                                    type="password"
                                    className="input input-bordered w-full"
                                    placeholder="Минимум 8 символов"
                                    value={form.password}
                                    onChange={update('password')}
                                    required
                                    minLength={8}
                                />
                            </label>

                            <div className="flex flex-col w-full">
                                <label className="flex items-start gap-2 cursor-pointer w-full">
                                    <input
                                        type="checkbox"
                                        checked={agree}
                                        onChange={(e) => setAgree(e.target.checked)}
                                        className="checkbox checkbox-primary mt-0.5"
                                    />
                                    <span className="text-sm leading-snug">
                                        Нажимая на кнопку «Создать аккаунт», вы даёте согласие на
                                        обработку персональных данных и соглашаетесь с{' '}
                                        <button
                                            type="button"
                                            className="link text-primary underline"
                                            onClick={() => setIsPolicyModalOpen(true)}
                                        >
                                            политикой конфиденциальности
                                        </button>
                                    </span>
                                </label>
                            </div>

                            {error && <div className="alert alert-error text-sm">{error}</div>}

                            <button
                                type="submit"
                                className="btn btn-primary w-full"
                                disabled={isLoading || isPolicyLoading || isPolicyError}
                            >
                                {isLoading ? (
                                    <span className="loading loading-spinner loading-sm" />
                                ) : (
                                    'Создать аккаунт'
                                )}
                            </button>
                        </form>

                        <p className="text-center text-sm mt-4">
                            Уже есть аккаунт?{' '}
                            <Link href="/login" className="link link-primary">
                                Войти
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <PrivacyPolicyModal
                isOpen={isPolicyModalOpen}
                onClose={() => setIsPolicyModalOpen(false)}
                onAgree={handleAgreeFromModal}
            />
        </PageContainer>
    );
}
