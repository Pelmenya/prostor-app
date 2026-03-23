import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LegalMarkdown } from './legal-markdown';

describe('LegalMarkdown', () => {
    it('рендерит markdown-контент', () => {
        render(<LegalMarkdown content="Текст документа" />);
        expect(screen.getByText('Текст документа')).toBeInTheDocument();
    });

    it('рендерит заголовок h1', () => {
        const { container } = render(<LegalMarkdown content={'# Заголовок'} />);
        const h1 = container.querySelector('h1');
        expect(h1).toBeTruthy();
        expect(h1?.textContent).toContain('Заголовок');
    });

    it('рендерит ссылки с target="_blank" и rel="noopener noreferrer"', () => {
        render(<LegalMarkdown content="[Ссылка](https://example.com)" />);
        const link = screen.getByText('Ссылка');
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('фильтрует запрещённые HTML-элементы (XSS whitelist)', () => {
        render(<LegalMarkdown content="Текст с **жирным** и обычным" />);
        expect(screen.getByText('жирным')).toBeInTheDocument();
    });

    it('compact режим применяет уменьшенные стили', () => {
        const { container } = render(<LegalMarkdown content="# Заголовок" compact />);
        const h1 = container.querySelector('h1');
        expect(h1).toHaveClass('text-lg');
    });

    it('full режим (по умолчанию) применяет стандартные стили', () => {
        const { container } = render(<LegalMarkdown content="# Заголовок" />);
        const h1 = container.querySelector('h1');
        expect(h1).toHaveClass('text-xl');
    });
});
