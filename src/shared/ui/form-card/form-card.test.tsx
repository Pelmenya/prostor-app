import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FormCard } from './form-card';

describe('FormCard', () => {
    it('рендерит children', () => {
        render(
            <FormCard onSubmit={vi.fn()} submitText="Сохранить">
                <input type="text" placeholder="Поле" />
            </FormCard>,
        );
        expect(screen.getByPlaceholderText('Поле')).toBeInTheDocument();
    });

    it('рендерит кнопку с текстом submitText', () => {
        render(
            <FormCard onSubmit={vi.fn()} submitText="Изменить пароль">
                <input type="text" />
            </FormCard>,
        );
        expect(screen.getByRole('button', { name: 'Изменить пароль' })).toBeInTheDocument();
    });

    it('кнопка задизейблена при isLoading=true', () => {
        render(
            <FormCard onSubmit={vi.fn()} submitText="Сохранить" isLoading>
                <input type="text" />
            </FormCard>,
        );
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('кнопка активна при isLoading=false', () => {
        render(
            <FormCard onSubmit={vi.fn()} submitText="Сохранить" isLoading={false}>
                <input type="text" />
            </FormCard>,
        );
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('вызывает onSubmit при сабмите формы', async () => {
        const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
        const user = userEvent.setup();
        render(
            <FormCard onSubmit={onSubmit} submitText="Сохранить">
                <input type="text" />
            </FormCard>,
        );
        await user.click(screen.getByRole('button', { name: 'Сохранить' }));
        expect(onSubmit).toHaveBeenCalledOnce();
    });
});
