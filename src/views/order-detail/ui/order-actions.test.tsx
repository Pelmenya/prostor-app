import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { EOrderStatus } from '@/entities/order';
import { OrderActions } from './order-actions';

const EXECUTOR = { first_name: 'Иван', last_name: 'Иванов' };

describe('OrderActions', () => {
    describe('статус COMPLETED', () => {
        it('показывает "Оценить мастера" когда есть исполнитель', () => {
            render(
                <OrderActions
                    orderId={1}
                    status={EOrderStatus.COMPLETED}
                    executor={EXECUTOR}
                    isCancelled={false}
                    isCancelling={false}
                    onCancelClick={vi.fn()}
                />,
            );
            expect(screen.getByText('Оценить мастера')).toBeInTheDocument();
        });

        it('возвращает null когда нет исполнителя', () => {
            const { container } = render(
                <OrderActions
                    orderId={1}
                    status={EOrderStatus.COMPLETED}
                    executor={null}
                    isCancelled={false}
                    isCancelling={false}
                    onCancelClick={vi.fn()}
                />,
            );
            expect(container.firstChild).toBeNull();
        });

        it('"Оценить мастера" — ссылка на страницу отзыва', () => {
            render(
                <OrderActions
                    orderId={42}
                    status={EOrderStatus.COMPLETED}
                    executor={EXECUTOR}
                    isCancelled={false}
                    isCancelling={false}
                    onCancelClick={vi.fn()}
                />,
            );
            const link = screen.getByRole('link', { name: 'Оценить мастера' });
            expect(link).toHaveAttribute('href', '/orders/42/feedback');
        });
    });

    describe('остальные статусы', () => {
        it('показывает "Задать вопрос" и "Отменить"', () => {
            render(
                <OrderActions
                    orderId={1}
                    status={EOrderStatus.PENDING}
                    executor={null}
                    isCancelled={false}
                    isCancelling={false}
                    onCancelClick={vi.fn()}
                />,
            );
            expect(screen.getByText('Задать вопрос')).toBeInTheDocument();
            expect(screen.getByText('Отменить')).toBeInTheDocument();
        });

        it('"Задать вопрос" — ссылка на чат заказа', () => {
            render(
                <OrderActions
                    orderId={1}
                    status={EOrderStatus.PENDING}
                    executor={null}
                    isCancelled={false}
                    isCancelling={false}
                    onCancelClick={vi.fn()}
                />,
            );
            const link = screen.getByRole('link', { name: /Задать вопрос/i });
            expect(link).toHaveAttribute('href', '/orders/1/chat');
        });

        it('"Отменить" дизейблена когда isCancelled=true', () => {
            render(
                <OrderActions
                    orderId={1}
                    status={EOrderStatus.PENDING}
                    executor={null}
                    isCancelled
                    isCancelling={false}
                    onCancelClick={vi.fn()}
                />,
            );
            expect(screen.getByText('Отменить')).toBeDisabled();
        });

        it('"Отменить" дизейблена когда isCancelling=true', () => {
            render(
                <OrderActions
                    orderId={1}
                    status={EOrderStatus.PENDING}
                    executor={null}
                    isCancelled={false}
                    isCancelling
                    onCancelClick={vi.fn()}
                />,
            );
            expect(screen.getByText('Отменить')).toBeDisabled();
        });

        it('вызывает onCancelClick при клике на "Отменить"', async () => {
            const onCancelClick = vi.fn();
            render(
                <OrderActions
                    orderId={1}
                    status={EOrderStatus.PENDING}
                    executor={null}
                    isCancelled={false}
                    isCancelling={false}
                    onCancelClick={onCancelClick}
                />,
            );
            await userEvent.click(screen.getByText('Отменить'));
            expect(onCancelClick).toHaveBeenCalledOnce();
        });
    });
});
