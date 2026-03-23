import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegisterPage } from './register-page';

const mockPush = vi.fn();
const mockGet = vi.fn().mockReturnValue(null);

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    useSearchParams: () => ({ get: mockGet }),
}));

vi.mock('@/features/auth', () => ({
    webRegister: vi.fn().mockResolvedValue({
        user: { id: 1, first_name: 'Тест', last_name: 'Тестов' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
    }),
}));

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

beforeEach(() => {
    vi.clearAllMocks();
});

describe('RegisterPage', () => {
    it('рендерит все поля формы', () => {
        renderWithQuery(<RegisterPage />);

        expect(screen.getByPlaceholderText('Имя')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Фамилия')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('+7 999 999-99-99')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Минимум 8 символов')).toBeInTheDocument();
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

        // Заполняем все поля, но не ставим чекбоксы
        await user.type(screen.getByPlaceholderText('Имя'), 'Тест');
        await user.type(screen.getByPlaceholderText('Фамилия'), 'Тестов');
        await user.type(screen.getByPlaceholderText('Email'), 'test@mail.ru');
        await user.type(screen.getByPlaceholderText('+7 999 999-99-99'), '9991234567');
        await user.type(screen.getByPlaceholderText('Минимум 8 символов'), 'password123');

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
});
