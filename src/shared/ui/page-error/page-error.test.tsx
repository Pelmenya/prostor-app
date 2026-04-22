import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageError } from './page-error';

describe('PageError', () => {
    it('показывает сообщение по умолчанию', () => {
        render(<PageError />);
        expect(screen.getByText('Ошибка загрузки данных')).toBeInTheDocument();
    });

    it('показывает кастомное сообщение', () => {
        render(<PageError message="Нет соединения" />);
        expect(screen.getByText('Нет соединения')).toBeInTheDocument();
    });

    it('не показывает кнопку без onRetry', () => {
        render(<PageError />);
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('показывает кнопку и вызывает onRetry при клике', async () => {
        const onRetry = vi.fn();
        render(<PageError onRetry={onRetry} />);

        const button = screen.getByRole('button', { name: /попробовать снова/i });
        await userEvent.click(button);
        expect(onRetry).toHaveBeenCalledOnce();
    });
});
