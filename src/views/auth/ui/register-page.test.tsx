import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegisterPage } from './register-page';
import { ApiError } from '@/shared/api';

const mockPush = vi.fn();
const mockGet = vi.fn().mockReturnValue(null);
const mockWebRegister = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    useSearchParams: () => ({ get: mockGet }),
}));

vi.mock('@/features/auth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/features/auth')>();
    return {
        ...actual,
        webRegister: (...args: unknown[]) => mockWebRegister(...args),
        resendVerification: vi.fn().mockResolvedValue({ success: true }),
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

vi.mock('@/entities/privacy-policy', () => ({
    useCurrentPolicy: () => ({
        data: { version: '1.0.0', content: '# Политика', effectiveDate: '2026-01-01' },
        isLoading: false,
        isError: false,
    }),
}));

vi.mock('@/entities/personal-data-agreement', () => ({
    useCurrentAgreement: () => ({
        data: { version: '1.0.0', content: '# Согласие', effectiveDate: '2026-01-01' },
        isLoading: false,
        isError: false,
    }),
}));

function renderWithQuery(ui: React.ReactElement) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

async function fillAndSubmitForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByPlaceholderText('Имя'), 'Тест');
    await user.type(screen.getByPlaceholderText('Фамилия'), 'Тестов');
    await user.type(screen.getByPlaceholderText('Email'), 'test@mail.ru');
    await user.type(screen.getByPlaceholderText('+7 999 999-99-99'), '9991234567');
    await user.type(screen.getByPlaceholderText('Пароль (минимум 8 символов)'), 'password123');

    const checkboxes = screen.getAllByRole('checkbox');
    for (const cb of checkboxes) {
        await user.click(cb);
    }

    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));
}

beforeEach(() => {
    vi.clearAllMocks();
    mockWebRegister.mockResolvedValue({
        user: { id: 1, first_name: 'Тест', last_name: 'Тестов' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
    });
});

describe('RegisterPage', () => {
    it('рендерит все поля формы', () => {
        renderWithQuery(<RegisterPage />);

        expect(screen.getByPlaceholderText('Имя')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Фамилия')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('+7 999 999-99-99')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Пароль (минимум 8 символов)')).toBeInTheDocument();
    });

    it('рендерит два чекбокса согласий со ссылками', () => {
        renderWithQuery(<RegisterPage />);

        const policyLink = screen.getByRole('link', { name: /политику конфиденциальности/i });
        const pdLink = screen.getByRole('link', { name: /обработку персональных данных/i });

        expect(policyLink).toHaveAttribute('href', '/privacy-policy');
        expect(policyLink).toHaveAttribute('target', '_blank');
        expect(pdLink).toHaveAttribute('href', '/personal-data-agreement');
        expect(pdLink).toHaveAttribute('target', '_blank');
    });

    it('рендерит кнопку "Создать аккаунт"', () => {
        renderWithQuery(<RegisterPage />);

        expect(screen.getByRole('button', { name: 'Создать аккаунт' })).toBeInTheDocument();
    });

    it('показывает ошибки валидации при пустой отправке', async () => {
        const user = userEvent.setup();
        renderWithQuery(<RegisterPage />);

        await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

        await waitFor(() => {
            expect(screen.getByText('Имя обязательно')).toBeInTheDocument();
            expect(screen.getByText('Фамилия обязательна')).toBeInTheDocument();
            expect(screen.getByText('Введите email')).toBeInTheDocument();
        });
    });

    it('показывает ошибки чекбоксов при отправке без согласий', async () => {
        const user = userEvent.setup();
        renderWithQuery(<RegisterPage />);

        await user.type(screen.getByPlaceholderText('Имя'), 'Тест');
        await user.type(screen.getByPlaceholderText('Фамилия'), 'Тестов');
        await user.type(screen.getByPlaceholderText('Email'), 'test@mail.ru');
        await user.type(screen.getByPlaceholderText('+7 999 999-99-99'), '9991234567');
        await user.type(screen.getByPlaceholderText('Пароль (минимум 8 символов)'), 'password123');

        await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

        await waitFor(() => {
            expect(
                screen.getByText('Необходимо согласие с политикой конфиденциальности'),
            ).toBeInTheDocument();
            expect(
                screen.getByText('Необходимо согласие на обработку персональных данных'),
            ).toBeInTheDocument();
        });
    });

    it('рендерит ссылку на логин', () => {
        renderWithQuery(<RegisterPage />);

        const loginLink = screen.getByRole('link', { name: 'Войти' });
        expect(loginLink).toHaveAttribute('href', '/login');
    });

    // ── Привязка аккаунтов ──

    it('показывает экран верификации при 409 (email из телеги, не верифицирован)', async () => {
        mockWebRegister.mockRejectedValue(
            new ApiError(409, 'Conflict', {
                message: 'Подтвердите email',
                needsVerification: true,
            }),
        );

        const user = userEvent.setup();
        renderWithQuery(<RegisterPage />);

        await fillAndSubmitForm(user);

        await waitFor(() => {
            expect(screen.getByText('Подтвердите email')).toBeInTheDocument();
            expect(screen.getByText(/уже существует/)).toBeInTheDocument();
            expect(screen.getByText(/зарегистрируйтесь повторно/)).toBeInTheDocument();
        });
    });

    it('экран верификации содержит кнопку повторной отправки', async () => {
        mockWebRegister.mockRejectedValue(
            new ApiError(409, 'Conflict', { needsVerification: true }),
        );

        const user = userEvent.setup();
        renderWithQuery(<RegisterPage />);

        await fillAndSubmitForm(user);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Отправить повторно' })).toBeInTheDocument();
        });
    });

    it('экран верификации содержит ссылку на логин', async () => {
        mockWebRegister.mockRejectedValue(
            new ApiError(409, 'Conflict', { needsVerification: true }),
        );

        const user = userEvent.setup();
        renderWithQuery(<RegisterPage />);

        await fillAndSubmitForm(user);

        await waitFor(() => {
            expect(
                screen.getByRole('link', { name: /Войти в существующий аккаунт/ }),
            ).toHaveAttribute('href', '/login');
        });
    });

    it('показывает серверную ошибку при 400', async () => {
        mockWebRegister.mockRejectedValue(
            new ApiError(400, 'Bad Request', {
                message: 'Пользователь с таким email уже зарегистрирован',
            }),
        );

        const user = userEvent.setup();
        renderWithQuery(<RegisterPage />);

        await fillAndSubmitForm(user);

        await waitFor(() => {
            expect(
                screen.getByText('Пользователь с таким email уже зарегистрирован'),
            ).toBeInTheDocument();
        });
    });
});
