import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';

vi.mock('@headlessui/react', () => ({
    Transition: ({ show, children }: { show: boolean; children: React.ReactNode }) =>
        show ? <>{children}</> : null,
}));

vi.mock('@/shared/lib', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/lib')>();
    return { ...actual, useClickOutside: vi.fn() };
});

let mockIsSupported = false;

vi.mock('@/features/push-notifications', () => ({
    usePushNotifications: () => ({
        permission: 'default' as PermissionState,
        isSubscribed: false,
        isLoading: false,
        isSupported: mockIsSupported,
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
    }),
}));

vi.mock('@/shared/ui', () => ({
    ThemeToggle: () => <input type="checkbox" aria-label="Тема" />,
}));

vi.mock('next/navigation', () => ({
    usePathname: () => '/catalog',
}));

import { BurgerMenu } from './burger-menu';

const triggerRef = createRef<HTMLButtonElement>();

const defaultProps = {
    isOpen: true,
    isAuthenticated: false,
    user: null,
    onClose: vi.fn(),
    onLogout: vi.fn(),
    triggerRef,
};

beforeEach(() => {
    vi.clearAllMocks();
    mockIsSupported = false;
});

describe('BurgerMenu', () => {
    describe('видимость', () => {
        it('не рендерится когда isOpen = false', () => {
            render(<BurgerMenu {...defaultProps} isOpen={false} />);
            expect(screen.queryByRole('link', { name: /войти/i })).not.toBeInTheDocument();
        });

        it('рендерится когда isOpen = true', () => {
            render(<BurgerMenu {...defaultProps} />);
            expect(screen.getByRole('link', { name: /войти/i })).toBeInTheDocument();
        });
    });

    describe('незалогиненный пользователь', () => {
        it('показывает ссылки Войти и Регистрация', () => {
            render(<BurgerMenu {...defaultProps} />);
            expect(screen.getByRole('link', { name: /войти/i })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /регистрация/i })).toBeInTheDocument();
        });

        it('не показывает навигацию и кнопку Выйти', () => {
            render(<BurgerMenu {...defaultProps} />);
            expect(screen.queryByRole('link', { name: /заказы/i })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /выйти/i })).not.toBeInTheDocument();
        });

        it('ссылка Войти содержит текущий путь в параметре from', () => {
            render(<BurgerMenu {...defaultProps} />);
            const loginLink = screen.getByRole('link', { name: /войти/i });
            expect(loginLink).toHaveAttribute('href', '/login?from=%2Fcatalog');
        });
    });

    describe('залогиненный пользователь', () => {
        const authProps = {
            ...defaultProps,
            isAuthenticated: true,
            user: { firstName: 'Иван', lastName: 'Петров', email: 'ivan@example.com' },
        };

        it('показывает имя и email пользователя', () => {
            render(<BurgerMenu {...authProps} />);
            expect(screen.getByText('Иван Петров')).toBeInTheDocument();
            expect(screen.getByText('ivan@example.com')).toBeInTheDocument();
        });

        it('показывает инициалы', () => {
            render(<BurgerMenu {...authProps} />);
            expect(screen.getByText('ИП')).toBeInTheDocument();
        });

        it('показывает навигационные ссылки', () => {
            render(<BurgerMenu {...authProps} />);
            expect(screen.getByRole('link', { name: /заказы/i })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /мои адреса/i })).toBeInTheDocument();
        });

        it('не показывает Войти и Регистрация', () => {
            render(<BurgerMenu {...authProps} />);
            expect(screen.queryByRole('link', { name: /войти/i })).not.toBeInTheDocument();
            expect(screen.queryByRole('link', { name: /регистрация/i })).not.toBeInTheDocument();
        });

        it('кнопка Выйти вызывает onLogout и onClose', () => {
            const onLogout = vi.fn();
            const onClose = vi.fn();
            render(<BurgerMenu {...authProps} onLogout={onLogout} onClose={onClose} />);

            fireEvent.click(screen.getByRole('button', { name: /выйти/i }));

            expect(onLogout).toHaveBeenCalledOnce();
            expect(onClose).toHaveBeenCalledOnce();
        });

        it('корректно отображает пользователя без фамилии', () => {
            render(<BurgerMenu {...authProps} user={{ firstName: 'Иван' }} />);
            expect(screen.getByText('Иван')).toBeInTheDocument();
            expect(screen.getByText('И')).toBeInTheDocument();
        });
    });

    describe('переключатель темы', () => {
        it('всегда присутствует в меню', () => {
            render(<BurgerMenu {...defaultProps} />);
            expect(screen.getByText('Тёмная тема')).toBeInTheDocument();
        });
    });

    describe('пуш-уведомления', () => {
        const authProps = {
            ...defaultProps,
            isAuthenticated: true,
            user: { firstName: 'Иван', lastName: 'Петров', email: 'ivan@example.com' },
        };

        it('не показывает блок уведомлений незалогиненному даже если браузер поддерживает', () => {
            mockIsSupported = true;
            render(<BurgerMenu {...defaultProps} isAuthenticated={false} />);
            expect(screen.queryByText('Уведомления')).not.toBeInTheDocument();
        });

        it('показывает блок уведомлений залогиненному если браузер поддерживает', () => {
            mockIsSupported = true;
            render(<BurgerMenu {...authProps} />);
            expect(screen.getByText('Уведомления')).toBeInTheDocument();
        });

        it('не показывает блок уведомлений если браузер не поддерживает', () => {
            mockIsSupported = false;
            render(<BurgerMenu {...authProps} />);
            expect(screen.queryByText('Уведомления')).not.toBeInTheDocument();
        });
    });
});
