import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError } from '@/shared/api';
import { EUserRole } from '@/shared/model';
import { LoginPage } from './login-page';

const mockPush = vi.fn();
const mockGet = vi.fn().mockReturnValue(null);

const { mockSetTokens, mockSetUser } = vi.hoisted(() => ({
    mockSetTokens: vi.fn(),
    mockSetUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    useSearchParams: () => ({ get: mockGet }),
}));

// telegramNonce вызывается изнутри useTelegramOidc (lib/use-telegram-oidc.ts)
// через относительный импорт '../api/auth-api' — мокаем этот листовой модуль
// напрямую, чтобы перехватить и прямые импорты из '@/features/auth', и
// внутренний вызов хука (оба резолвятся в один и тот же файл).
vi.mock('@/features/auth/api/auth-api', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/features/auth/api/auth-api')>();
    return {
        ...actual,
        telegramNonce: vi.fn(),
    };
});

vi.mock('@/features/auth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/features/auth')>();
    return {
        ...actual,
        webLogin: vi.fn().mockResolvedValue({
            user: { id: 1, first_name: 'Тест', last_name: 'Тестов' },
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
        }),
        telegramLogin: vi.fn(),
        setTelegramRegistration: vi.fn(),
    };
});

vi.mock('@/shared/lib', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        useAuthStore: vi.fn(() => ({
            setTokens: mockSetTokens,
            setUser: mockSetUser,
        })),
    };
});

beforeEach(() => {
    vi.clearAllMocks();
    // WR-06: useFormDraft персистит email в sessionStorage между тестами —
    // без очистки поле Email в следующем тесте предзаполняется прошлым
    // значением и user.type() дописывает поверх, ломая email-валидацию.
    sessionStorage.clear();
});

afterEach(() => {
    // window.Telegram — глобал, объявленный use-telegram-oidc.ts как
    // опциональный; не должен утекать между тестами.
    delete window.Telegram;
});

describe('LoginPage', () => {
    it('рендерит поля email и пароль', () => {
        render(<LoginPage />);

        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument();
    });

    it('рендерит кнопку "Войти"', () => {
        render(<LoginPage />);

        expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
    });

    it('показывает ошибки валидации при пустой отправке', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        await user.click(screen.getByRole('button', { name: 'Войти' }));

        await waitFor(() => {
            expect(screen.getByText('Введите email')).toBeInTheDocument();
            expect(screen.getByText('Введите пароль')).toBeInTheDocument();
        });
    });

    it('не вызывает webLogin при невалидных данных', async () => {
        const { webLogin } = await import('@/features/auth');
        const user = userEvent.setup();
        render(<LoginPage />);

        // Заполняем только пароль, email пустой
        await user.type(screen.getByPlaceholderText('Пароль'), 'password123');
        await user.click(screen.getByRole('button', { name: 'Войти' }));

        await waitFor(() => {
            expect(screen.getByText('Введите email')).toBeInTheDocument();
        });
        expect(webLogin).not.toHaveBeenCalled();
    });

    it('вызывает webLogin при валидных данных', async () => {
        const { webLogin } = await import('@/features/auth');
        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByPlaceholderText('Email'), 'test@mail.ru');
        await user.type(screen.getByPlaceholderText('Пароль'), 'password123');
        await user.click(screen.getByRole('button', { name: 'Войти' }));

        await waitFor(() => {
            expect(webLogin).toHaveBeenCalledWith({
                email: 'test@mail.ru',
                password: 'password123',
            });
        });
    });

    it('редиректит после успешного логина', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByPlaceholderText('Email'), 'test@mail.ru');
        await user.type(screen.getByPlaceholderText('Пароль'), 'password123');
        await user.click(screen.getByRole('button', { name: 'Войти' }));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });

    it('рендерит ссылку на регистрацию', () => {
        render(<LoginPage />);

        const registerLink = screen.getByRole('link', { name: 'Зарегистрироваться' });
        expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('LOGIN-02: подавляет backend-сообщение 401 и показывает locked-строку', async () => {
        const { webLogin } = await import('@/features/auth');
        vi.mocked(webLogin).mockRejectedValueOnce(
            new ApiError(401, 'Unauthorized', { message: 'User not found' }),
        );
        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByPlaceholderText('Email'), 'test@mail.ru');
        await user.type(screen.getByPlaceholderText('Пароль'), 'password123');
        await user.click(screen.getByRole('button', { name: 'Войти' }));

        await waitFor(() => {
            expect(screen.getByText('Неверная почта или пароль')).toBeInTheDocument();
        });
        expect(screen.queryByText('User not found')).not.toBeInTheDocument();
    });

    it('LOGIN-02: показывает locked-строку и без поля message в data (defense-in-depth)', async () => {
        const { webLogin } = await import('@/features/auth');
        vi.mocked(webLogin).mockRejectedValueOnce(new ApiError(401, 'Unauthorized', {}));
        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByPlaceholderText('Email'), 'test@mail.ru');
        await user.type(screen.getByPlaceholderText('Пароль'), 'password123');
        await user.click(screen.getByRole('button', { name: 'Войти' }));

        await waitFor(() => {
            expect(screen.getByText('Неверная почта или пароль')).toBeInTheDocument();
        });
    });

    it('WR-01: не показывает locked-строку для не-401 ApiError (например 429)', async () => {
        const { webLogin } = await import('@/features/auth');
        vi.mocked(webLogin).mockRejectedValueOnce(
            new ApiError(429, 'Too Many Requests', { message: 'rate limited' }),
        );
        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByPlaceholderText('Email'), 'test@mail.ru');
        await user.type(screen.getByPlaceholderText('Пароль'), 'password123');
        await user.click(screen.getByRole('button', { name: 'Войти' }));

        await waitFor(() => {
            expect(screen.getByText('Не удалось войти. Попробуйте позже.')).toBeInTheDocument();
        });
        expect(screen.queryByText('Неверная почта или пароль')).not.toBeInTheDocument();
    });

    describe('TG-01: вход через Telegram', () => {
        it('клик по кнопке переводит в состояние nonce-loading, вызывает telegramNonce, email-форма остаётся доступной', async () => {
            const { telegramNonce } = await import('@/features/auth/api/auth-api');
            // Никогда не резолвим — тест смотрит только на промежуточное состояние.
            vi.mocked(telegramNonce).mockReturnValue(new Promise(() => {}));
            window.Telegram = { Login: { auth: vi.fn() } };

            const user = userEvent.setup();
            render(<LoginPage />);

            await user.click(screen.getByRole('button', { name: 'Войти через Telegram' }));

            await waitFor(() => {
                expect(screen.getByText('Открываем Telegram…')).toBeInTheDocument();
            });
            expect(telegramNonce).toHaveBeenCalledOnce();
            // Email-форма и её submit независимы от состояния Telegram-кнопки.
            expect(screen.getByRole('button', { name: 'Войти' })).toBeEnabled();
        });

        it('успешный вход: id_token → telegramLogin → токены сохранены → редирект', async () => {
            const { telegramNonce } = await import('@/features/auth/api/auth-api');
            const { telegramLogin } = await import('@/features/auth');
            vi.mocked(telegramNonce).mockResolvedValue({ nonce: 'test-nonce' });
            vi.mocked(telegramLogin).mockResolvedValue({
                user: {
                    id: 2,
                    uuid: 'uuid-2',
                    first_name: 'Телеграм',
                    last_name: 'Юзер',
                    role: EUserRole.CLIENT,
                    is_auth: true,
                },
                accessToken: 'tg-access',
                refreshToken: 'tg-refresh',
            });
            window.Telegram = {
                Login: {
                    auth: vi.fn((_options, callback) => {
                        callback({ id_token: 'id-token-abc' });
                    }),
                },
            };

            const user = userEvent.setup();
            render(<LoginPage />);

            await user.click(screen.getByRole('button', { name: 'Войти через Telegram' }));

            await waitFor(() => {
                expect(telegramLogin).toHaveBeenCalledWith('id-token-abc');
            });
            await waitFor(() => {
                expect(mockSetTokens).toHaveBeenCalledWith('tg-access', 'tg-refresh');
            });
            expect(mockSetUser).toHaveBeenCalledWith({
                id: 2,
                uuid: 'uuid-2',
                first_name: 'Телеграм',
                last_name: 'Юзер',
                role: EUserRole.CLIENT,
                is_auth: true,
            });
            expect(mockPush).toHaveBeenCalledWith('/');
        });

        it('TG-02: registrationRequired сохраняет token/profile в sessionStorage и редиректит на /telegram-register без сохранения токенов', async () => {
            const { telegramNonce } = await import('@/features/auth/api/auth-api');
            const { telegramLogin, setTelegramRegistration } = await import('@/features/auth');
            vi.mocked(telegramNonce).mockResolvedValue({ nonce: 'test-nonce' });
            vi.mocked(telegramLogin).mockResolvedValue({
                registrationRequired: true,
                registrationToken: 'reg-token-xyz',
                profile: { first_name: 'Новый', last_name: 'Юзер' },
            });
            window.Telegram = {
                Login: {
                    auth: vi.fn((_options, callback) => {
                        callback({ id_token: 'id-token-new' });
                    }),
                },
            };

            const user = userEvent.setup();
            render(<LoginPage />);

            await user.click(screen.getByRole('button', { name: 'Войти через Telegram' }));

            await waitFor(() => {
                expect(setTelegramRegistration).toHaveBeenCalledWith('reg-token-xyz', {
                    first_name: 'Новый',
                    last_name: 'Юзер',
                });
            });
            expect(mockPush).toHaveBeenCalledWith('/telegram-register');
            expect(mockSetTokens).not.toHaveBeenCalled();
        });

        it('popup заблокирован браузером: кнопка возвращается в idle, показывается специальная копия', async () => {
            const { telegramNonce } = await import('@/features/auth/api/auth-api');
            vi.mocked(telegramNonce).mockResolvedValue({ nonce: 'test-nonce' });
            window.Telegram = {
                Login: {
                    auth: vi.fn(() => {
                        throw new Error('Popup blocked by browser');
                    }),
                },
            };

            const user = userEvent.setup();
            render(<LoginPage />);

            await user.click(screen.getByRole('button', { name: 'Войти через Telegram' }));

            await waitFor(() => {
                expect(
                    screen.getByText('Разрешите всплывающие окна в браузере и попробуйте снова'),
                ).toBeInTheDocument();
            });
            expect(screen.getByRole('button', { name: 'Войти через Telegram' })).toBeEnabled();
            expect(screen.getByRole('button', { name: 'Войти' })).toBeEnabled();
        });

        it('общая ошибка Telegram-входа: кнопка возвращается в idle, показывается generic-копия', async () => {
            const { telegramNonce } = await import('@/features/auth/api/auth-api');
            vi.mocked(telegramNonce).mockResolvedValue({ nonce: 'test-nonce' });
            window.Telegram = {
                Login: {
                    auth: vi.fn((_options, callback) => {
                        callback({ error: 'something_went_wrong' });
                    }),
                },
            };

            const user = userEvent.setup();
            render(<LoginPage />);

            await user.click(screen.getByRole('button', { name: 'Войти через Telegram' }));

            await waitFor(() => {
                expect(
                    screen.getByText('Не удалось войти через Telegram. Попробуйте ещё раз.'),
                ).toBeInTheDocument();
            });
            expect(screen.getByRole('button', { name: 'Войти через Telegram' })).toBeEnabled();
            expect(screen.getByRole('button', { name: 'Войти' })).toBeEnabled();
        });
    });
});
