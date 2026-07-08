import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VerifyEmailPage } from './verify-email-page';

const mockVerifyEmail = vi.fn();
const mockFetchCurrentUser = vi.fn();
const mockSetUser = vi.fn();
let mockToken: string | null = 'valid-token';
let mockAccessToken: string | null = null;

vi.mock('@/features/auth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/features/auth')>();
    return {
        ...actual,
        verifyEmail: (...args: unknown[]) => mockVerifyEmail(...args),
        fetchCurrentUser: (...args: unknown[]) => mockFetchCurrentUser(...args),
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

vi.mock('@/shared/lib', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/lib')>();
    return {
        ...actual,
        useAuthStore: Object.assign(
            vi.fn((selector?: (s: Record<string, unknown>) => unknown) =>
                selector
                    ? selector({ accessToken: mockAccessToken, user: null, setUser: mockSetUser })
                    : {},
            ),
            {
                getState: () => ({
                    accessToken: mockAccessToken,
                    user: null,
                    setUser: mockSetUser,
                }),
            },
        ),
    };
});

function renderWithProviders(ui: React.ReactElement) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return {
        queryClient,
        ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
    };
}

describe('VerifyEmailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockToken = 'valid-token';
        mockAccessToken = null;
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
            expect(screen.getByText('Почта подтверждена')).toBeInTheDocument();
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

    it('обновляет данные юзера после смены email', async () => {
        mockAccessToken = 'test-jwt';
        const freshUser = { id: 1, email: 'new@mail.ru', first_name: 'Test' };
        mockVerifyEmail.mockResolvedValue({ success: true, emailChanged: true });
        mockFetchCurrentUser.mockResolvedValue(freshUser);

        const { queryClient } = renderWithProviders(<VerifyEmailPage />);

        await waitFor(() => {
            expect(screen.getByText('Email изменён')).toBeInTheDocument();
        });

        expect(mockFetchCurrentUser).toHaveBeenCalledWith('test-jwt');
        expect(mockSetUser).toHaveBeenCalledWith(freshUser);
        expect(queryClient.getQueryData(['user', 'me'])).toEqual(freshUser);
    });

    it('не запрашивает юзера без accessToken', async () => {
        mockAccessToken = null;
        mockVerifyEmail.mockResolvedValue({ success: true, emailChanged: true });
        renderWithProviders(<VerifyEmailPage />);

        await waitFor(() => {
            expect(screen.getByText('Email изменён')).toBeInTheDocument();
        });

        expect(mockFetchCurrentUser).not.toHaveBeenCalled();
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
