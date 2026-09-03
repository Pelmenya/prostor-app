import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderScheduleDialog } from './order-schedule-dialog';

vi.mock('@/shared/ui', () => ({
    CompactModal: ({
        children,
        isOpen,
    }: {
        children: React.ReactNode;
        isOpen: boolean;
        title?: string;
        onClose?: () => void;
    }) => (isOpen ? <>{children}</> : null),
}));

vi.mock('@/shared/lib', () => ({
    formatDateRu: (date: string) => date,
}));

const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    executorsWithWorkDays: [],
    searchStatus: 'failed' as const,
};

// IntervalPicker отображается когда searchStatus === 'failed'
describe('IntervalPicker — валидация интервала дат', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        HTMLInputElement.prototype.showPicker = vi.fn();
        HTMLInputElement.prototype.reportValidity = vi.fn();
    });

    const getInputs = (container: HTMLElement) => ({
        fromInput: container.querySelector<HTMLInputElement>('[name="from"]')!,
        toInput: container.querySelector<HTMLInputElement>('[name="to"]')!,
        form: container.querySelector('form')!,
    });

    it('не вызывает onSelect когда дата "по" раньше даты "с"', () => {
        const { container } = render(<OrderScheduleDialog {...defaultProps} />);
        const { fromInput, toInput, form } = getInputs(container);

        fireEvent.change(fromInput, { target: { value: '2026-04-10' } });
        fireEvent.change(toInput, { target: { value: '2026-04-05' } }); // to < from
        fireEvent.submit(form);

        expect(defaultProps.onSelect).not.toHaveBeenCalled();
    });

    it('устанавливает ошибку валидации на поле "по" при неверном интервале', () => {
        const { container } = render(<OrderScheduleDialog {...defaultProps} />);
        const { fromInput, toInput, form } = getInputs(container);

        fireEvent.change(fromInput, { target: { value: '2026-04-10' } });
        fireEvent.change(toInput, { target: { value: '2026-04-05' } }); // to < from
        fireEvent.submit(form);

        expect(toInput.validationMessage).toBe('Дата окончания должна быть не раньше даты начала');
        expect(toInput.validity.valid).toBe(false);
    });

    it('сбрасывает ошибку валидации при изменении поля "по"', () => {
        const { container } = render(<OrderScheduleDialog {...defaultProps} />);
        const { fromInput, toInput, form } = getInputs(container);

        // Сначала получаем ошибку
        fireEvent.change(fromInput, { target: { value: '2026-04-10' } });
        fireEvent.change(toInput, { target: { value: '2026-04-05' } });
        fireEvent.submit(form);
        expect(toInput.validity.valid).toBe(false);

        // Исправляем дату — onChange должен сбросить setCustomValidity
        fireEvent.change(toInput, { target: { value: '2026-04-15' } });
        expect(toInput.validity.valid).toBe(true);
        expect(toInput.validationMessage).toBe('');
    });

    it('вызывает onSelect с корректными датами после исправления ошибки', () => {
        const { container } = render(<OrderScheduleDialog {...defaultProps} />);
        const { fromInput, toInput, form } = getInputs(container);

        // Первый сабмит с неверными датами
        fireEvent.change(fromInput, { target: { value: '2026-04-10' } });
        fireEvent.change(toInput, { target: { value: '2026-04-05' } });
        fireEvent.submit(form);
        expect(defaultProps.onSelect).not.toHaveBeenCalled();

        // Исправляем дату "по"
        fireEvent.change(toInput, { target: { value: '2026-04-15' } });

        // Повторный сабмит — должен пройти
        fireEvent.submit(form);
        expect(defaultProps.onSelect).toHaveBeenCalledWith({
            user: null,
            workDays: [
                expect.objectContaining({ date: '2026-04-10' }),
                expect.objectContaining({ date: '2026-04-15' }),
            ],
        });
    });

    it('вызывает onSelect с корректными датами при изначально валидном интервале', () => {
        const { container } = render(<OrderScheduleDialog {...defaultProps} />);
        const { fromInput, toInput, form } = getInputs(container);

        fireEvent.change(fromInput, { target: { value: '2026-04-10' } });
        fireEvent.change(toInput, { target: { value: '2026-04-20' } });
        fireEvent.submit(form);

        expect(defaultProps.onSelect).toHaveBeenCalledWith({
            user: null,
            workDays: [
                expect.objectContaining({ date: '2026-04-10' }),
                expect.objectContaining({ date: '2026-04-20' }),
            ],
        });
    });

    it('не отправляет форму если поля пустые', () => {
        const { container } = render(<OrderScheduleDialog {...defaultProps} />);
        const { form } = getInputs(container);

        fireEvent.submit(form);

        expect(defaultProps.onSelect).not.toHaveBeenCalled();
    });

    it('отображает кнопку "Выбрать"', () => {
        render(<OrderScheduleDialog {...defaultProps} />);
        expect(screen.getByRole('button', { name: 'Выбрать' })).toBeInTheDocument();
    });
});

describe('IntervalPicker — сохранение дат при повторном открытии', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        HTMLInputElement.prototype.showPicker = vi.fn();
        HTMLInputElement.prototype.reportValidity = vi.fn();
    });

    it('инициализирует поля ранее выбранными датами', () => {
        const desiredIntervalDate: [
            {
                date: string;
                startHour: number;
                startMinute: number;
                endHour: number;
                endMinute: number;
            },
            {
                date: string;
                startHour: number;
                startMinute: number;
                endHour: number;
                endMinute: number;
            },
        ] = [
            { date: '2026-04-10', startHour: 9, startMinute: 0, endHour: 18, endMinute: 0 },
            { date: '2026-04-20', startHour: 9, startMinute: 0, endHour: 18, endMinute: 0 },
        ];

        const { container } = render(
            <OrderScheduleDialog {...defaultProps} desiredIntervalDate={desiredIntervalDate} />,
        );

        const fromInput = container.querySelector<HTMLInputElement>('[name="from"]')!;
        const toInput = container.querySelector<HTMLInputElement>('[name="to"]')!;

        expect(fromInput.defaultValue).toBe('2026-04-10');
        expect(toInput.defaultValue).toBe('2026-04-20');
    });
});
