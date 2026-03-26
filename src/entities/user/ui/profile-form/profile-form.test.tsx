import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ProfileForm } from './profile-form';
import type { TUser } from '@/shared/model';

const mockUser: TUser = {
    id: 1,
    uuid: 'uuid-1',
    first_name: 'Иван',
    last_name: 'Иванов',
    phone: '+79991234567',
    email: 'ivan@mail.ru',
    role: 'client',
    is_auth: true,
};

describe('ProfileForm', () => {
    it('предзаполняет поля из user', () => {
        render(<ProfileForm user={mockUser} onSubmit={vi.fn()} />);

        expect(screen.getByPlaceholderText('Имя')).toHaveValue('Иван');
        expect(screen.getByPlaceholderText('Фамилия')).toHaveValue('Иванов');
        expect(screen.getByPlaceholderText('Почта')).toHaveValue('ivan@mail.ru');
    });

    it('маскирует телефон при предзаполнении', () => {
        render(<ProfileForm user={mockUser} onSubmit={vi.fn()} />);

        expect(screen.getByPlaceholderText('+7 999 999-99-99')).toHaveValue('+7 999 123-45-67');
    });

    it('рендерит пустую форму когда user=null', () => {
        render(<ProfileForm user={null} onSubmit={vi.fn()} />);

        expect(screen.getByPlaceholderText('Имя')).toHaveValue('');
        expect(screen.getByPlaceholderText('Фамилия')).toHaveValue('');
        expect(screen.getByPlaceholderText('Почта')).toHaveValue('');
    });

    it('показывает ошибки валидации при пустой отправке', async () => {
        const user = userEvent.setup();
        render(<ProfileForm user={null} onSubmit={vi.fn()} />);

        await user.click(screen.getByRole('button', { name: 'Сохранить' }));

        await waitFor(() => {
            expect(screen.getByText('Имя обязательно')).toBeInTheDocument();
            expect(screen.getByText('Фамилия обязательна')).toBeInTheDocument();
            expect(screen.getByText('Формат: +7 999 999-99-99')).toBeInTheDocument();
            expect(screen.getByText('Неверный формат почты')).toBeInTheDocument();
        });
    });

    it('не вызывает onSubmit при невалидных данных', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<ProfileForm user={null} onSubmit={onSubmit} />);

        await user.click(screen.getByRole('button', { name: 'Сохранить' }));

        await waitFor(() => {
            expect(screen.getByText('Имя обязательно')).toBeInTheDocument();
        });
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('вызывает onSubmit с данными предзаполненной формы', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<ProfileForm user={mockUser} onSubmit={onSubmit} />);

        await user.click(screen.getByRole('button', { name: 'Сохранить' }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
        expect(onSubmit.mock.calls[0][0]).toEqual({
            first_name: 'Иван',
            last_name: 'Иванов',
            phone: '+79991234567',
            email: 'ivan@mail.ru',
        });
    });

    it('вызывает onSubmit с обновлённым email', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<ProfileForm user={mockUser} onSubmit={onSubmit} />);

        await user.clear(screen.getByPlaceholderText('Почта'));
        await user.type(screen.getByPlaceholderText('Почта'), 'new@mail.ru');
        await user.click(screen.getByRole('button', { name: 'Сохранить' }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
        expect(onSubmit.mock.calls[0][0]).toMatchObject({ email: 'new@mail.ru' });
    });

    it('кнопка задизейблена при isLoading=true', () => {
        render(<ProfileForm user={mockUser} onSubmit={vi.fn()} isLoading />);

        expect(screen.getByRole('button')).toBeDisabled();
    });
});
