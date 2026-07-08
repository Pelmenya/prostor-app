import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError } from '@/shared/api';
import { LoginPage } from './login-page';

const mockPush = vi.fn();
const mockGet = vi.fn().mockReturnValue(null);

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    useSearchParams: () => ({ get: mockGet }),
}));

vi.mock('@/features/auth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/features/auth')>();
    return {
        ...actual,
        webLogin: vi.fn().mockResolvedValue({
            user: { id: 1, first_name: 'Тест', last_name: 'Тестов' },
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
        }),
    };
});

vi.mock('@/shared/lib', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        useAuthStore: vi.fn(() => ({
            setTokens: vi.fn(),
            setUser: vi.fn(),
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
});
