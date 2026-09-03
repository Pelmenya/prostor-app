import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FeedbackStarsBlock } from './feedback-stars-block';
import { FEEDBACK_STRUCTURE } from '../../lib/feedback-structure';

const fullParams = {
    quality: { politeness: 3, accuracy: 4, shoeChange: 5, appearance: 2 },
    competence: { taskUnderstanding: 4, productKnowledge: 5, explanation: 3, troubleshooting: 4 },
    speed: { punctuality: 5, normHours: 4 },
};

describe('FeedbackStarsBlock', () => {
    it('рендерит все секции и подписи', () => {
        render(<FeedbackStarsBlock parameters={fullParams} />);
        expect(screen.getByText('Качество')).toBeInTheDocument();
        expect(screen.getByText('Профессиональные компетенции')).toBeInTheDocument();
        expect(screen.getByText('Скорость')).toBeInTheDocument();
        expect(screen.getByText('Вежливость')).toBeInTheDocument();
    });

    it('отображает значение критерия', () => {
        render(<FeedbackStarsBlock parameters={fullParams} />);
        const values = screen.getAllByText('3');
        expect(values.length).toBeGreaterThan(0);
    });

    it('показывает "—" для нулевого критерия', () => {
        render(<FeedbackStarsBlock parameters={{ quality: { politeness: 0 } }} />);
        expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });

    it('вызывает onChange при клике на звезду', async () => {
        const onChange = vi.fn();
        render(
            <FeedbackStarsBlock
                structure={[
                    {
                        key: 'quality',
                        label: 'Качество',
                        children: [{ key: 'politeness', label: 'Вежливость' }],
                    },
                ]}
                parameters={{ quality: { politeness: 0 } }}
                onChange={onChange}
            />,
        );
        const stars = screen.getAllByRole('radio');
        await userEvent.click(stars[2]);
        expect(onChange).toHaveBeenCalledWith(['quality', 'politeness'], 3);
    });

    it('в режиме readonly все звёзды задизейблены', () => {
        render(
            <FeedbackStarsBlock parameters={fullParams} readonly structure={FEEDBACK_STRUCTURE} />,
        );
        const stars = screen.getAllByRole('radio');
        stars.forEach((star) => expect(star).toBeDisabled());
    });
});
