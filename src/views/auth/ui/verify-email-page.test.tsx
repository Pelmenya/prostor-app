import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { VerifyEmailPage } from './verify-email-page';

const mockVerifyEmail = vi.fn();
let mockToken: string | null = 'valid-token';

vi.mock('@/features/auth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/features/auth')>();
    return {
        ...actual,
        verifyEmail: (...args: unknown[]) => mockVerifyEmail(...args),
    };
});

vi.mock('next/navigation', () => ({
    useSearchParams: () => ({
        get: (key: string) => (key === 'token' ? mockToken : null),
    }),
}));

vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

describe('VerifyEmailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockToken = 'valid-token';
    });

    it('показывает спиннер во время верификации', () => {
        mockVerifyEmail.mockReturnValue(new Promise(() => {})); // never resolves
        render(<VerifyEmailPage />);
        expect(screen.getByText('Подтверждаем email...')).toBeInTheDocument();
    });

    it('показывает успех при валидном токене', async () => {
        mockVerifyEmail.mockResolvedValue({ success: true });
        render(<VerifyEmailPage />);

        await waitFor(() => {
            expect(screen.getByText('Email подтверждён')).toBeInTheDocument();
        });
        expect(mockVerifyEmail).toHaveBeenCalledWith('valid-token');
    });

    it('показывает ошибку при невалидном токене', async () => {
        mockVerifyEmail.mockRejectedValue(new Error('Invalid'));
        render(<VerifyEmailPage />);

        await waitFor(() => {
            expect(screen.getByText('Ссылка недействительна или истекла')).toBeInTheDocument();
        });
    });

    it('показывает ошибку без token в URL', () => {
        mockToken = null;
        render(<VerifyEmailPage />);
        expect(screen.getByText('Недействительная ссылка')).toBeInTheDocument();
        expect(mockVerifyEmail).not.toHaveBeenCalled();
    });

    it('ссылка на каталог после успеха', async () => {
        mockVerifyEmail.mockResolvedValue({ success: true });
        render(<VerifyEmailPage />);

        await waitFor(() => {
            expect(screen.getByText('Перейти в каталог').closest('a')).toHaveAttribute(
                'href',
                '/catalog',
            );
        });
    });
});
