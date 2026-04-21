import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EOrderStatus } from '@/entities/order';
import { OrderStatusBlock } from './order-status-block';

const BASE_PROPS = {
    scheduledDate: undefined,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T12:00:00Z',
    isCompact: false,
};

describe('OrderStatusBlock', () => {
    it('показывает степпер когда isCompact=false', () => {
        render(<OrderStatusBlock {...BASE_PROPS} status={EOrderStatus.PENDING} />);
        expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('скрывает степпер когда isCompact=true', () => {
        render(<OrderStatusBlock {...BASE_PROPS} status={EOrderStatus.COMPLETED} isCompact />);
        expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it.each([
        [EOrderStatus.PENDING, 'Создан'],
        [EOrderStatus.CONFIRMED, 'Подтверждён'],
        [EOrderStatus.IN_PROGRESS, 'Запланирован'],
        [EOrderStatus.COMPLETED, 'Выполнен'],
        [EOrderStatus.CANCELLED, 'Отменен'],
    ])('показывает текст статуса "%s" → "%s"', (status, text) => {
        render(<OrderStatusBlock {...BASE_PROPS} status={status} />);
        expect(screen.getByText(text)).toBeInTheDocument();
    });

    it('показывает дату создания для статуса PENDING', () => {
        render(<OrderStatusBlock {...BASE_PROPS} status={EOrderStatus.PENDING} />);
        expect(screen.getByText(/янв/i)).toBeInTheDocument();
    });

    it('показывает дату обновления для статуса COMPLETED', () => {
        render(<OrderStatusBlock {...BASE_PROPS} status={EOrderStatus.COMPLETED} />);
        expect(screen.getByText(/янв/i)).toBeInTheDocument();
    });

    it('показывает "Уточняется" когда scheduledDate=null', () => {
        render(<OrderStatusBlock {...BASE_PROPS} status={EOrderStatus.IN_PROGRESS} />);
        expect(screen.getByText('Уточняется')).toBeInTheDocument();
    });

    it('показывает дату доставки когда scheduledDate задан', () => {
        render(
            <OrderStatusBlock
                {...BASE_PROPS}
                status={EOrderStatus.IN_PROGRESS}
                scheduledDate={{
                    date: '2024-02-10',
                    startHour: 9,
                    startMinute: 0,
                    endHour: 11,
                    endMinute: 0,
                }}
            />,
        );
        expect(screen.getByText(/10 февраля/)).toBeInTheDocument();
    });
});
