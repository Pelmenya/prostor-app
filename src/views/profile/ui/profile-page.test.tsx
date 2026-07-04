import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfilePage } from './profile-page';

const mockResendVerification = vi.fn();
const mockReplace = vi.fn();

const baseUser = {
    id: 1,
    uuid: 'test-uuid',
    first_name: 'Тест',
    last_name: 'Тестов',
    role: 'client',
    is_auth: true,
};

let mockAccessToken: string | null = 'test-access-token';
let mockUser: typeof baseUser | null = baseUser;

vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace: mockReplace }),
}));

vi.mock('@/features/auth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/features/auth')>();
    return {
        ...actual,
        resendVerification: (...args: unknown[]) => mockResendVerification(...args),
    };
});

vi.mock('@/shared/lib', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        useAuthStore: vi.fn((selector?: (s: Record<string, unknown>) => unknown) =>
            selector
                ? selector({ user: mockUser, accessToken: mockAccessToken })
                : { user: mockUser, accessToken: mockAccessToken },
        ),
    };
});

describe('ProfilePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAccessToken = 'test-access-token';
        mockUser = baseUser;
    });

    it('REG-04: рендерит кабинет для пользователя без поля email-верификации', () => {
        render(<ProfilePage />);

        expect(screen.getByText('Личный кабинет')).toBeInTheDocument();
        expect(screen.getByText('Тест Тестов')).toBeInTheDocument();
    });

    it('VERIFY-03: клик по «Отправить письмо повторно» вызывает resendVerification и показывает успех', async () => {
        mockResendVerification.mockResolvedValue({ success: true });
        const user = userEvent.setup();
        render(<ProfilePage />);

        await user.click(screen.getByRole('button', { name: 'Отправить письмо повторно' }));

        expect(mockResendVerification).toHaveBeenCalledWith('test-access-token');

        await waitFor(() => {
            expect(screen.getByText('Письмо отправлено')).toBeInTheDocument();
        });
    });

    it('VERIFY-03: кнопка disabled во время запроса, повторный клик не шлёт второй запрос', async () => {
        let resolvePromise: (value: { success: boolean }) => void;
        mockResendVerification.mockReturnValue(
            new Promise((resolve) => {
                resolvePromise = resolve;
            }),
        );
        const user = userEvent.setup();
        render(<ProfilePage />);

        const button = screen.getByRole('button', { name: 'Отправить письмо повторно' });
        await user.click(button);

        await waitFor(() => {
            expect(button).toBeDisabled();
        });

        await user.click(button);
        expect(mockResendVerification).toHaveBeenCalledTimes(1);

        resolvePromise!({ success: true });
        await waitFor(() => {
            expect(button).not.toBeDisabled();
        });
    });

    it('VERIFY-03: при ошибке не показывает «Письмо отправлено»', async () => {
        mockResendVerification.mockRejectedValue(new Error('fail'));
        const user = userEvent.setup();
        render(<ProfilePage />);

        await user.click(screen.getByRole('button', { name: 'Отправить письмо повторно' }));

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Отправить письмо повторно' }),
            ).not.toBeDisabled();
        });

        expect(screen.queryByText('Письмо отправлено')).not.toBeInTheDocument();
    });

    it('WR-02: редиректит неавторизованного пользователя на /login и ничего не рендерит', async () => {
        mockUser = null;
        render(<ProfilePage />);

        expect(screen.queryByText('Личный кабинет')).not.toBeInTheDocument();
        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/login?from=%2Fprofile');
        });
    });
});
