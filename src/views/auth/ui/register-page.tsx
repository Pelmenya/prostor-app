'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { webRegister } from '@/features/auth';
import { ApiError } from '@/shared/api';
import { useAuthStore } from '@/shared/lib/auth';
import { extractErrorMessage } from '@/shared/lib/extract-error-message';
import {
    normalizeRuPhone,
    formatRuPhoneForView,
    denormalizeViewToE164,
} from '@/shared/lib/formatters/phone';
import { useCurrentPolicy } from '@/entities/privacy-policy';
import { PageContainer } from '@/shared/ui';
import { PrivacyPolicyModal } from './privacy-policy-modal';

const phoneE164Ru = /^\+7\d{10}$/;

const registerSchema = z.object({
    first_name: z.string().min(1, 'Имя обязательно'),
    last_name: z.string().min(1, 'Фамилия обязательна'),
    email: z.string().min(1, 'Введите email').email('Неверный формат email'),
    phone: z.string().regex(phoneE164Ru, 'Введите номер в формате +7 999 999-99-99'),
    password: z.string().min(8, 'Минимум 8 символов'),
    agree: z.boolean().refine((v) => v === true, {
        message: 'Необходимо согласие с политикой конфиденциальности',
    }),
});

type TRegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
    const router = useRouter();
    const { setTokens, setUser } = useAuthStore();
    const {
        data: currentPolicy,
        isLoading: isPolicyLoading,
        isError: isPolicyError,
    } = useCurrentPolicy();

    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors, isSubmitting },
    } = useForm<TRegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            password: '',
            agree: false,
        },
    });

    const agree = useWatch({ name: 'agree', control });

    const handleAgreeFromModal = () => {
        setValue('agree', true, { shouldValidate: true });
        setIsPolicyModalOpen(false);
    };

    const onSubmit = async (form: TRegisterForm) => {
        setServerError(null);

        if (!currentPolicy?.version) {
            setServerError('Не удалось загрузить политику конфиденциальности. Обновите страницу.');
            return;
        }

        try {
            const { agree: _, ...payload } = form;
            const data = await webRegister({
                ...payload,
                policyVersion: currentPolicy.version,
            });
            setTokens(data.accessToken, data.refreshToken);
            setUser(data.user);
            router.push('/');
        } catch (err) {
            if (err instanceof ApiError) {
                setServerError(extractErrorMessage(err.data, 'Ошибка регистрации'));
            } else {
                setServerError('Ошибка сети');
            }
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

                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="flex flex-col gap-4 mt-4"
                        >
                            <div className="form-control">
                                <label className="floating-label">
                                    <span>Имя</span>
                                    <input
                                        type="text"
                                        className={`input input-bordered w-full ${errors.first_name ? 'input-error' : ''}`}
                                        placeholder="Имя"
                                        {...register('first_name')}
                                    />
                                </label>
                                {errors.first_name && (
                                    <p className="text-error text-xs mt-1">
                                        {errors.first_name.message}
                                    </p>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="floating-label">
                                    <span>Фамилия</span>
                                    <input
                                        type="text"
                                        className={`input input-bordered w-full ${errors.last_name ? 'input-error' : ''}`}
                                        placeholder="Фамилия"
                                        {...register('last_name')}
                                    />
                                </label>
                                {errors.last_name && (
                                    <p className="text-error text-xs mt-1">
                                        {errors.last_name.message}
                                    </p>
                                )}
                            </div>

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
                                    <p className="text-error text-xs mt-1">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => {
                                    const rawDigits = normalizeRuPhone(field.value || '');
                                    const viewMasked = formatRuPhoneForView(rawDigits);

                                    return (
                                        <div className="form-control">
                                            <label className="floating-label">
                                                <span>Телефон</span>
                                                <input
                                                    type="tel"
                                                    className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`}
                                                    placeholder="+7 999 999-99-99"
                                                    inputMode="tel"
                                                    autoComplete="tel"
                                                    maxLength={18}
                                                    value={viewMasked}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            denormalizeViewToE164(e.target.value),
                                                        )
                                                    }
                                                    onPaste={(e) => {
                                                        e.preventDefault();
                                                        const text =
                                                            e.clipboardData.getData('text');
                                                        field.onChange(denormalizeViewToE164(text));
                                                    }}
                                                />
                                            </label>
                                            {errors.phone && (
                                                <p className="text-error text-xs mt-1">
                                                    {errors.phone.message}
                                                </p>
                                            )}
                                        </div>
                                    );
                                }}
                            />

                            <div className="form-control">
                                <label className="floating-label">
                                    <span>Пароль</span>
                                    <input
                                        type="password"
                                        className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
                                        placeholder="Минимум 8 символов"
                                        {...register('password')}
                                    />
                                </label>
                                {errors.password && (
                                    <p className="text-error text-xs mt-1">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col w-full">
                                <label className="flex items-start gap-2 cursor-pointer w-full">
                                    <input
                                        type="checkbox"
                                        checked={agree}
                                        onChange={(e) =>
                                            setValue('agree', e.target.checked, {
                                                shouldValidate: true,
                                            })
                                        }
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
                                {errors.agree && (
                                    <p className="text-error text-xs mt-1">
                                        {errors.agree.message}
                                    </p>
                                )}
                            </div>

                            {serverError && (
                                <div className="alert alert-error text-sm">{serverError}</div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary w-full"
                                disabled={isSubmitting || isPolicyLoading || isPolicyError}
                            >
                                {isSubmitting ? (
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
