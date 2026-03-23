import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LegalDocumentMeta } from './legal-document-meta';

const mockDocument = {
    version: '2.1.0',
    content: '# Документ',
    effectiveDate: '2026-01-15',
};

describe('LegalDocumentMeta', () => {
    it('рендерит версию документа', () => {
        render(<LegalDocumentMeta document={mockDocument} />);
        expect(screen.getByText('Версия: 2.1.0')).toBeInTheDocument();
    });

    it('рендерит дату вступления в силу', () => {
        render(<LegalDocumentMeta document={mockDocument} />);
        expect(screen.getByText(/Действует с:/)).toBeInTheDocument();
        expect(screen.getByText(/2026/)).toBeInTheDocument();
    });

    it('применяет дополнительный className', () => {
        const { container } = render(
            <LegalDocumentMeta document={mockDocument} className="mb-4" />,
        );
        expect(container.firstChild).toHaveClass('mb-4');
    });
});
