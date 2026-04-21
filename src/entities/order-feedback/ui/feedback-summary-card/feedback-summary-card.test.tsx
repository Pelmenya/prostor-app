import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FeedbackSummaryCard } from './feedback-summary-card';

const params = {
    quality: { politeness: 4, accuracy: 5, shoeChange: 3, appearance: 4 },
    competence: { taskUnderstanding: 5, productKnowledge: 4, explanation: 3, troubleshooting: 4 },
    speed: { punctuality: 5, normHours: 4 },
};

describe('FeedbackSummaryCard', () => {
    it('рендерит заголовок «Отзыв»', () => {
        render(<FeedbackSummaryCard parameters={params} />);
        expect(screen.getByText('Отзыв')).toBeInTheDocument();
    });

    it('показывает комментарий если передан', () => {
        render(<FeedbackSummaryCard parameters={params} comment="Отличная работа" />);
        expect(screen.getByText('Отличная работа')).toBeInTheDocument();
    });

    it('не показывает комментарий если не передан', () => {
        render(<FeedbackSummaryCard parameters={params} />);
        expect(screen.queryByText('Комментарий:')).toBeNull();
    });

    it('показывает кнопку «Редактировать» если передан onEdit', () => {
        render(<FeedbackSummaryCard parameters={params} onEdit={vi.fn()} />);
        expect(screen.getByText('Редактировать')).toBeInTheDocument();
    });

    it('не показывает кнопку «Редактировать» без onEdit', () => {
        render(<FeedbackSummaryCard parameters={params} />);
        expect(screen.queryByText('Редактировать')).toBeNull();
    });

    it('вызывает onEdit при клике', async () => {
        const onEdit = vi.fn();
        render(<FeedbackSummaryCard parameters={params} onEdit={onEdit} />);
        await userEvent.click(screen.getByText('Редактировать'));
        expect(onEdit).toHaveBeenCalledOnce();
    });
});
