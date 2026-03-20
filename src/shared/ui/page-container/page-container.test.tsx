import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PageContainer } from './page-container';

describe('PageContainer', () => {
    it('рендерит children', () => {
        render(<PageContainer>Контент</PageContainer>);
        expect(screen.getByText('Контент')).toBeInTheDocument();
    });

    it('применяет дефолтный фон bg-base-300', () => {
        const { container } = render(<PageContainer>Тест</PageContainer>);
        expect(container.firstChild).toHaveClass('bg-base-300');
    });

    it('применяет кастомный фон', () => {
        const { container } = render(<PageContainer bg="bg-base-100">Тест</PageContainer>);
        expect(container.firstChild).toHaveClass('bg-base-100');
        expect(container.firstChild).not.toHaveClass('bg-base-300');
    });

    it('мержит className', () => {
        const { container } = render(<PageContainer className="mt-4">Тест</PageContainer>);
        expect(container.firstChild).toHaveClass('mt-4');
        expect(container.firstChild).toHaveClass('page-container');
    });
});
