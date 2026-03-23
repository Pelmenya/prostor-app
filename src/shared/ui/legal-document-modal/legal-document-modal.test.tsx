import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LegalDocumentModal } from './legal-document-modal';

const mockDocument = {
    version: '1.0.0',
    content: '# Заголовок\n\nТекст документа',
    effectiveDate: '2026-01-15',
};

// happy-dom не поддерживает dialog.showModal(), мокаем
beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
});

describe('LegalDocumentModal', () => {
    it('показывает спиннер при загрузке', () => {
        render(
            <LegalDocumentModal
                isOpen={true}
                onClose={vi.fn()}
                onAgree={vi.fn()}
                title="Тестовый документ"
                agreeLabel="Согласен"
                errorMessage="Ошибка загрузки"
                document={undefined}
                isLoading={true}
                isError={false}
            />,
        );
        expect(document.querySelector('.loading-spinner')).toBeTruthy();
    });

    it('показывает ошибку при isError', () => {
        render(
            <LegalDocumentModal
                isOpen={true}
                onClose={vi.fn()}
                onAgree={vi.fn()}
                title="Тестовый документ"
                agreeLabel="Согласен"
                errorMessage="Не удалось загрузить"
                document={undefined}
                isLoading={false}
                isError={true}
            />,
        );
        expect(screen.getByText('Не удалось загрузить')).toBeInTheDocument();
    });

    it('рендерит документ с версией и контентом', () => {
        render(
            <LegalDocumentModal
                isOpen={true}
                onClose={vi.fn()}
                onAgree={vi.fn()}
                title="Политика"
                agreeLabel="Соглашаюсь"
                errorMessage="Ошибка"
                document={mockDocument}
                isLoading={false}
                isError={false}
            />,
        );
        expect(screen.getByText('Политика')).toBeInTheDocument();
        expect(screen.getByText('Версия: 1.0.0')).toBeInTheDocument();
        expect(screen.getByText('Текст документа')).toBeInTheDocument();
        expect(screen.getByText('Соглашаюсь')).toBeInTheDocument();
    });

    it('кнопка согласия заблокирована при загрузке', () => {
        render(
            <LegalDocumentModal
                isOpen={true}
                onClose={vi.fn()}
                onAgree={vi.fn()}
                title="Документ"
                agreeLabel="Согласен"
                errorMessage="Ошибка"
                document={undefined}
                isLoading={true}
                isError={false}
            />,
        );
        expect(screen.getByText('Согласен')).toBeDisabled();
    });

    it('кнопка согласия заблокирована при ошибке', () => {
        render(
            <LegalDocumentModal
                isOpen={true}
                onClose={vi.fn()}
                onAgree={vi.fn()}
                title="Документ"
                agreeLabel="Согласен"
                errorMessage="Ошибка"
                document={undefined}
                isLoading={false}
                isError={true}
            />,
        );
        expect(screen.getByText('Согласен')).toBeDisabled();
    });

    it('вызывает onAgree по клику', async () => {
        const user = userEvent.setup();
        const onAgree = vi.fn();
        render(
            <LegalDocumentModal
                isOpen={true}
                onClose={vi.fn()}
                onAgree={onAgree}
                title="Документ"
                agreeLabel="Согласен"
                errorMessage="Ошибка"
                document={mockDocument}
                isLoading={false}
                isError={false}
            />,
        );
        await user.click(screen.getByText('Согласен'));
        expect(onAgree).toHaveBeenCalledOnce();
    });

    it('вызывает onClose по клику на "Отмена"', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(
            <LegalDocumentModal
                isOpen={true}
                onClose={onClose}
                onAgree={vi.fn()}
                title="Документ"
                agreeLabel="Согласен"
                errorMessage="Ошибка"
                document={mockDocument}
                isLoading={false}
                isError={false}
            />,
        );
        await user.click(screen.getByText('Отмена'));
        expect(onClose).toHaveBeenCalledOnce();
    });
});
