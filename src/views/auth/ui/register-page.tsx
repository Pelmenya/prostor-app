'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFormContext, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { webRegister } from '@/features/auth';
import { ApiError } from '@/shared/api';
import {
    useAuthStore,
    extractErrorMessage,
    normalizeRuPhone,
    formatRuPhoneForView,
    denormalizeViewToE164,
    getSafeRedirect,
} from '@/shared/lib';
import { useCurrentPolicy } from '@/entities/privacy-policy';
import { useCurrentAgreement } from '@/entities/personal-data-agreement';
import { PageContainer, FormField } from '@/shared/ui';

const phoneE164Ru = /^\+7\d{10}$/;

const registerSchema = z.object({
    first_name: z.string().trim().min(1, 'Имя обязательно'),
    last_name: z.string().trim().min(1, 'Фамилия обязательна'),
    email: z.string().trim().toLowerCase().min(1, 'Введите email').email('Неверный формат email'),
    phone: z.string().regex(phoneE164Ru, 'Введите номер в формате +7 999 999-99-99'),
    password: z.string().min(8, 'Минимум 8 символов'),
    agreePolicy: z.boolean().refine((v) => v === true, {
        message: 'Необходимо согласие с политикой конфиденциальности',
    }),
    agreePd: z.boolean().refine((v) => v === true, {
        message: 'Необходимо согласие на обработку персональных данных',
    }),
});

type TRegisterForm = z.infer<typeof registerSchema>;

function ConsentCheckboxes() {
    const {
        register,
        formState: { errors },
    } = useFormContext<TRegisterForm>();

    return (
        <div className="flex flex-col w-full gap-3">
            <div>
                <label className="flex items-start gap-2 cursor-pointer w-full">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-primary mt-0.5"
                        {...register('agreePolicy')}
                    />
                    <span className="text-sm leading-snug">
                        Принимаю{' '}
                        <a
                            href="/privacy-policy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link text-primary underline"
                        >
                            политику конфиденциальности
                        </a>
                    </span>
                </label>
                {errors.agreePolicy && (
                    <p className="text-error text-xs mt-1">{errors.agreePolicy.message}</p>
                )}
            </div>

            <div>
                <label className="flex items-start gap-2 cursor-pointer w-full">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-primary mt-0.5"
                        {...register('agreePd')}
                    />
                    <span className="text-sm leading-snug">
                        Даю согласие на{' '}
                        <a
                            href="/personal-data-agreement"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link text-primary underline"
                        >
                            обработку персональных данных
                        </a>
                    </span>
                </label>
                {errors.agreePd && (
                    <p className="text-error text-xs mt-1">{errors.agreePd.message}</p>
                )}
            </div>
        </div>
    );
}

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setTokens, setUser } = useAuthStore();
    const {
        data: currentPolicy,
        isLoading: isPolicyLoading,
        isError: isPolicyError,
    } = useCurrentPolicy();
    const {
        data: currentAgreement,
        isLoading: isAgreementLoading,
        isError: isAgreementError,
    } = useCurrentAgreement();

    const [serverError, setServerError] = useState<string | null>(null);

    const methods = useForm<TRegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            password: '',
            agreePolicy: false,
            agreePd: false,
        },
    });

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = methods;

    const onSubmit = async (form: TRegisterForm) => {
        setServerError(null);

        if (!currentPolicy?.version || !currentAgreement?.version) {
            setServerError('Не удалось загрузить документы. Обновите страницу.');
            return;
        }

        try {
            const data = await webRegister({
                first_name: form.first_name,
                last_name: form.last_name,
                email: form.email,
                phone: form.phone,
                password: form.password,
                policyVersion: currentPolicy.version,
                pdAgreementVersion: currentAgreement.version,
            });
            setTokens(data.accessToken, data.refreshToken);
            setUser(data.user);
            router.push(getSafeRedirect(searchParams.get('from')));
        } catch (err) {
            if (err instanceof ApiError) {
                // 409 — email найден в телеге, но не верифицирован
                if (err.status === 409) {
                    router.push(`/register/verify-email?email=${encodeURIComponent(form.email)}`);
                    return;
                }
                setServerError(extractErrorMessage(err.data, 'Ошибка регистрации'));
            } else {
                setServerError('Ошибка сети');
            }
        }
    };

    return (
        <div className="card bg-base-200 shadow-xl w-full max-w-md">
            <div className="card-body">
                <h1 className="card-title text-2xl gradient-text">Регистрация</h1>

                {(isPolicyError || isAgreementError) && (
                    <div className="alert alert-error text-sm">
                        Не удалось загрузить документы. Обновите страницу.
                    </div>
                )}

                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-4">
                        <FormField label="Имя" error={errors.first_name?.message}>
                            <input
                                type="text"
                                className={`input input-bordered w-full ${errors.first_name ? 'input-error' : ''}`}
                                placeholder="Имя"
                                {...register('first_name')}
                            />
                        </FormField>

                        <FormField label="Фамилия" error={errors.last_name?.message}>
                            <input
                                type="text"
                                className={`input input-bordered w-full ${errors.last_name ? 'input-error' : ''}`}
                                placeholder="Фамилия"
                                {...register('last_name')}
                            />
                        </FormField>

                        <FormField label="Email" error={errors.email?.message}>
                            <input
                                type="email"
                                className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                                placeholder="Email"
                                {...register('email')}
                            />
                        </FormField>

                        <Controller
                            name="phone"
                            control={control}
                            render={({ field }) => {
                                const rawDigits = normalizeRuPhone(field.value || '');
                                const viewMasked = formatRuPhoneForView(rawDigits);

                                return (
                                    <FormField label="Телефон" error={errors.phone?.message}>
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
                                                const text = e.clipboardData.getData('text');
                                                field.onChange(denormalizeViewToE164(text));
                                            }}
                                        />
                                    </FormField>
                                );
                            }}
                        />

                        <FormField label="Пароль" error={errors.password?.message}>
                            <input
                                type="password"
                                className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
                                placeholder="Пароль (минимум 8 символов)"
                                {...register('password')}
                            />
                        </FormField>

                        <ConsentCheckboxes />

                        {serverError && (
                            <div className="alert alert-error text-sm">{serverError}</div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={
                                isSubmitting ||
                                isPolicyLoading ||
                                isPolicyError ||
                                isAgreementLoading ||
                                isAgreementError
                            }
                        >
                            {isSubmitting ? (
                                <span className="loading loading-spinner loading-sm" />
                            ) : (
                                'Создать аккаунт'
                            )}
                        </button>
                    </form>
                </FormProvider>

                <p className="text-center text-sm mt-4">
                    Уже есть аккаунт?{' '}
                    <Link href="/login" className="link link-primary">
                        Войти
                    </Link>
                </p>
            </div>
        </div>
    );
}

export function RegisterPage() {
    return (
        <PageContainer>
            <div className="flex items-center justify-center min-h-[60vh]">
                <Suspense fallback={<span className="loading loading-spinner loading-lg" />}>
                    <RegisterForm />
                </Suspense>
            </div>
        </PageContainer>
    );
}
