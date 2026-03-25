import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForgotPasswordPage } from './forgot-password-page';

const mockForgotPassword = vi.fn();

vi.mock('@/features/auth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/features/auth')>();
    return {
        ...actual,
        forgotPassword: (...args: unknown[]) => mockForgotPassword(...args),
    };
});

vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

describe('ForgotPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('рендерит форму', () => {
        render(<ForgotPasswordPage />);
        expect(screen.getByText('Восстановление пароля')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Отправить ссылку' })).toBeInTheDocument();
    });

    it('не отправляет при пустом email', async () => {
        const user = userEvent.setup();
        render(<ForgotPasswordPage />);

        await user.click(screen.getByRole('button', { name: 'Отправить ссылку' }));

        await waitFor(() => {
            expect(screen.getByText('Некорректный email')).toBeInTheDocument();
        });
        expect(mockForgotPassword).not.toHaveBeenCalled();
    });

    it('показывает успех после отправки', async () => {
        mockForgotPassword.mockResolvedValue({ success: true });
        const user = userEvent.setup();
        render(<ForgotPasswordPage />);

        await user.type(screen.getByPlaceholderText('Email'), 'test@mail.ru');
        await user.click(screen.getByRole('button', { name: 'Отправить ссылку' }));

        await waitFor(() => {
            expect(screen.getByText(/Мы отправили ссылку/)).toBeInTheDocument();
        });
        expect(mockForgotPassword).toHaveBeenCalledWith('test@mail.ru');
    });

    it('ссылка Войти ведёт на /login', () => {
        render(<ForgotPasswordPage />);
        expect(screen.getByText('Войти').closest('a')).toHaveAttribute('href', '/login');
    });
});
