import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

vi.mock('@/shared/api', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/api')>();
    return { ...actual, apiClient: vi.fn().mockResolvedValue({}) };
});

vi.mock('@/shared/lib', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/lib')>();
    return {
        ...actual,
        useAuthStore: Object.assign(
            vi.fn(() => ({})),
            {
                getState: () => ({ accessToken: null, setUser: vi.fn() }),
            },
        ),
    };
});

function renderWithProviders(ui: React.ReactElement) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('VerifyEmailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockToken = 'valid-token';
    });

    it('показывает спиннер во время верификации', () => {
        mockVerifyEmail.mockReturnValue(new Promise(() => {}));
        renderWithProviders(<VerifyEmailPage />);
        expect(screen.getByText('Подтверждаем email...')).toBeInTheDocument();
    });

    it('показывает успех при валидном токене', async () => {
        mockVerifyEmail.mockResolvedValue({ success: true });
        renderWithProviders(<VerifyEmailPage />);

        await waitFor(() => {
            expect(screen.getByText('Email подтверждён')).toBeInTheDocument();
        });
        expect(mockVerifyEmail).toHaveBeenCalledWith('valid-token');
    });

    it('показывает смену email при emailChanged', async () => {
        mockVerifyEmail.mockResolvedValue({ success: true, emailChanged: true });
        renderWithProviders(<VerifyEmailPage />);

        await waitFor(() => {
            expect(screen.getByText('Email изменён')).toBeInTheDocument();
        });
        expect(screen.getByText('В личный кабинет').closest('a')).toHaveAttribute(
            'href',
            '/profile',
        );
    });

    it('показывает ошибку при невалидном токене', async () => {
        mockVerifyEmail.mockRejectedValue(new Error('Invalid'));
        renderWithProviders(<VerifyEmailPage />);

        await waitFor(() => {
            expect(screen.getByText('Ссылка недействительна или истекла')).toBeInTheDocument();
        });
    });

    it('показывает ошибку без token в URL', () => {
        mockToken = null;
        renderWithProviders(<VerifyEmailPage />);
        expect(screen.getByText('Недействительная ссылка')).toBeInTheDocument();
        expect(mockVerifyEmail).not.toHaveBeenCalled();
    });

    it('ссылка на каталог после подтверждения', async () => {
        mockVerifyEmail.mockResolvedValue({ success: true });
        renderWithProviders(<VerifyEmailPage />);

        await waitFor(() => {
            expect(screen.getByText('Перейти в каталог').closest('a')).toHaveAttribute(
                'href',
                '/catalog',
            );
        });
    });
});
