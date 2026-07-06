'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    webLogin,
    loginSchema,
    telegramLogin,
    setTelegramRegistration,
    useTelegramOidc,
    type TLoginForm,
} from '@/features/auth';
import { ApiError, resetSessionExpiredNotified } from '@/shared/api';
import { useAuthStore, getSafeRedirect, useFormDraft, getFormDraft } from '@/shared/lib';
import { PageContainer, FormField, TelegramIcon } from '@/shared/ui';

// Копирайт-контракт (03-UI-SPEC.md) — не перефразировать.
const TELEGRAM_LABEL_BY_STATE: Record<string, string> = {
    'nonce-loading': 'Открываем Telegram…',
    'awaiting-popup': 'Ждём подтверждения в Telegram…',
    exchanging: 'Входим…',
};

const TELEGRAM_POPUP_BLOCKED_MESSAGE = 'Разрешите всплывающие окна в браузере и попробуйте снова';
const TELEGRAM_GENERIC_ERROR_MESSAGE = 'Не удалось войти через Telegram. Попробуйте ещё раз.';

// [ASSUMED, RESEARCH Pitfall 3] версия виджета не переверена live против
// core.telegram.org/widgets/login в этой сессии — сверить перед реальным
// BotFather-запуском (STATE.md: бот ещё не настроен в режиме Web Login).
const TELEGRAM_WIDGET_SRC = 'https://telegram.org/js/telegram-widget.js?22';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setTokens, setUser } = useAuthStore();
    const [serverError, setServerError] = useState<string | null>(null);

    const [telegramBusy, setTelegramBusy] = useState(false);
    const [telegramError, setTelegramError] = useState<string | null>(null);
    // NEXT_PUBLIC_TELEGRAM_CLIENT_ID пока не задан в .env.example (BotFather
    // Web Login ещё не настроен, см. STATE.md Blockers) — код готов к работе
    // сразу после появления переменной, живая проверка блокирована third-party.
    const { state: telegramState, getIdToken } = useTelegramOidc(
        Number(process.env.NEXT_PUBLIC_TELEGRAM_CLIENT_ID),
    );

    const loginDraft = getFormDraft<TLoginForm>('login-form-draft');
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<TLoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: loginDraft?.email ?? '', password: '' },
    });

    const { clearDraft } = useFormDraft('login-form-draft', watch, { exclude: ['password'] });

    const onSubmit = async (form: TLoginForm) => {
        setServerError(null);
        try {
            const data = await webLogin(form);
            clearDraft();
            setTokens(data.accessToken, data.refreshToken);
            setUser(data.user);
            resetSessionExpiredNotified();
            router.push(getSafeRedirect(searchParams.get('from')));
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                // OWASP A07: единое сообщение независимо от причины (несуществующий
                // email vs неверный пароль) — backend-message из 401-тела не рендерим.
                setServerError('Неверная почта или пароль');
            } else if (err instanceof ApiError) {
                setServerError('Не удалось войти. Попробуйте позже.');
            } else {
                setServerError('Ошибка сети');
            }
        }
    };

    const onTelegramClick = async () => {
        setTelegramError(null);
        setTelegramBusy(true);
        try {
            const result = await getIdToken();
            if ('error' in result) {
                setTelegramError(
                    result.error === 'popup-blocked'
                        ? TELEGRAM_POPUP_BLOCKED_MESSAGE
                        : TELEGRAM_GENERIC_ERROR_MESSAGE,
                );
                return;
            }

            const data = await telegramLogin(result.idToken);
            if ('registrationRequired' in data) {
                setTelegramRegistration(data.registrationToken, data.profile);
                router.push('/telegram-register');
                return;
            }

            setTokens(data.accessToken, data.refreshToken);
            setUser(data.user);
            resetSessionExpiredNotified();
            router.push(getSafeRedirect(searchParams.get('from')));
        } catch {
            setTelegramError(TELEGRAM_GENERIC_ERROR_MESSAGE);
        } finally {
            setTelegramBusy(false);
        }
    };

    return (
        <div className="card bg-base-200 shadow-xl w-full max-w-md">
            {/* Виджет предзагружается на монтировании — минимизирует разрыв
                между кликом и open() (RESEARCH Pitfall 1). НИКОГДА не
                выставлять Cross-Origin-Opener-Policy: same-origin на этой
                странице — разорвёт window.opener-связь Telegram-попапа
                (T-03-06, next.config.ts сегодня headers() не задаёт). */}
            <Script src={TELEGRAM_WIDGET_SRC} strategy="afterInteractive" />
            <div className="card-body">
                <h1 className="card-title text-2xl gradient-text">Вход</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-4">
                    <FormField label="Email" error={errors.email?.message}>
                        <input
                            type="email"
                            className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                            placeholder="Email"
                            {...register('email')}
                        />
                    </FormField>

                    <FormField label="Пароль" error={errors.password?.message}>
                        <input
                            type="password"
                            className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
                            placeholder="Пароль"
                            {...register('password')}
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
                            'Войти'
                        )}
                    </button>
                </form>

                <div className="divider text-sm text-base-content/50">или</div>

                <button
                    type="button"
                    className="btn btn-outline btn-primary w-full gap-2"
                    disabled={telegramBusy}
                    onClick={onTelegramClick}
                >
                    <TelegramIcon className="size-5" />
                    {telegramBusy ? (
                        <>
                            <span className="loading loading-spinner loading-sm" />
                            {TELEGRAM_LABEL_BY_STATE[telegramState] ?? 'Входим…'}
                        </>
                    ) : (
                        'Войти через Telegram'
                    )}
                </button>

                {telegramError && <div className="alert alert-error text-sm">{telegramError}</div>}

                <div className="flex flex-col items-center gap-2 mt-4 text-sm">
                    <p>
                        Нет аккаунта?{' '}
                        <Link href="/register" className="link link-primary">
                            Зарегистрироваться
                        </Link>
                    </p>
                    <p>
                        Забыли пароль?{' '}
                        <Link href="/forgot-password" className="link link-primary">
                            Восстановить
                        </Link>
                    </p>
                </div>
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
