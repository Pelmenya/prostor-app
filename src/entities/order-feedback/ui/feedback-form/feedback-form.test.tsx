import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FeedbackForm } from './feedback-form';

const fullParams = {
    quality: { politeness: 5, accuracy: 5, shoeChange: 5, appearance: 5 },
    competence: { taskUnderstanding: 5, productKnowledge: 5, explanation: 5, troubleshooting: 5 },
    speed: { punctuality: 5, normHours: 5 },
};

describe('FeedbackForm', () => {
    it('рендерит кнопку отправки', () => {
        render(<FeedbackForm isSubmitting={false} onSubmit={vi.fn()} />);
        expect(screen.getByText('Отправить отзыв')).toBeInTheDocument();
    });

    it('показывает кастомный submitLabel', () => {
        render(<FeedbackForm isSubmitting={false} onSubmit={vi.fn()} submitLabel="Сохранить" />);
        expect(screen.getByText('Сохранить')).toBeInTheDocument();
    });

    it('показывает кнопку «Отмена» если передан onCancel', () => {
        render(<FeedbackForm isSubmitting={false} onSubmit={vi.fn()} onCancel={vi.fn()} />);
        expect(screen.getByText('Отмена')).toBeInTheDocument();
    });

    it('вызывает onCancel при клике', async () => {
        const onCancel = vi.fn();
        render(<FeedbackForm isSubmitting={false} onSubmit={vi.fn()} onCancel={onCancel} />);
        await userEvent.click(screen.getByText('Отмена'));
        expect(onCancel).toHaveBeenCalledOnce();
    });

    it('показывает предупреждение при попытке отправить без оценок', async () => {
        render(<FeedbackForm isSubmitting={false} onSubmit={vi.fn()} />);
        await userEvent.click(screen.getByText('Отправить отзыв'));
        expect(
            screen.getByText('Пожалуйста, поставьте оценки по всем параметрам'),
        ).toBeInTheDocument();
    });

    it('вызывает onSubmit когда все оценки выставлены', async () => {
        const onSubmit = vi.fn();
        render(
            <FeedbackForm
                isSubmitting={false}
                onSubmit={onSubmit}
                initialParameters={fullParams}
            />,
        );
        await userEvent.click(screen.getByText('Отправить отзыв'));
        expect(onSubmit).toHaveBeenCalledOnce();
        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ parameters: fullParams, comment: '' }),
        );
    });

    it('дизейблит контролы во время отправки', () => {
        render(<FeedbackForm isSubmitting={true} onSubmit={vi.fn()} onCancel={vi.fn()} />);
        const buttons = screen.getAllByRole('button');
        buttons.forEach((btn) => expect(btn).toBeDisabled());
    });
});
