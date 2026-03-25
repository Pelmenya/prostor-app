import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockResetPassword = vi.fn();
const mockPush = vi.fn();
let mockToken: string | null = 'valid-token';

vi.mock('@/features/auth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/features/auth')>();
    return {
        ...actual,
        resetPassword: (...args: unknown[]) => mockResetPassword(...args),
    };
});

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    useSearchParams: () => ({
        get: (key: string) => (key === 'token' ? mockToken : null),
    }),
}));

vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

// Импортируем ПОСЛЕ моков
const { ResetPasswordPage } = await import('./reset-password-page');

describe('ResetPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockToken = 'valid-token';
    });

    it('рендерит форму нового пароля', async () => {
        render(<ResetPasswordPage />);
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Новый пароль' })).toBeInTheDocument();
        });
    });

    it('показывает ошибку без token', async () => {
        mockToken = null;
        render(<ResetPasswordPage />);
        await waitFor(() => {
            expect(screen.getByText(/Недействительная ссылка/)).toBeInTheDocument();
        });
    });

    it('показывает ошибку при коротком пароле', async () => {
        const user = userEvent.setup();
        render(<ResetPasswordPage />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Минимум 8 символов')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('Минимум 8 символов'), 'short');
        await user.type(screen.getByPlaceholderText('Повторите пароль'), 'short');
        await user.click(screen.getByRole('button', { name: 'Установить пароль' }));

        await waitFor(() => {
            expect(screen.getByText('Минимум 8 символов')).toBeInTheDocument();
        });
        expect(mockResetPassword).not.toHaveBeenCalled();
    });

    it('показывает успех после сброса', async () => {
        mockResetPassword.mockResolvedValue({ success: true });
        const user = userEvent.setup();
        render(<ResetPasswordPage />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Минимум 8 символов')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('Минимум 8 символов'), 'newpass123');
        await user.type(screen.getByPlaceholderText('Повторите пароль'), 'newpass123');
        await user.click(screen.getByRole('button', { name: 'Установить пароль' }));

        await waitFor(() => {
            expect(screen.getByText('Пароль обновлён')).toBeInTheDocument();
        });
        expect(mockResetPassword).toHaveBeenCalledWith('valid-token', 'newpass123');
    });
});
