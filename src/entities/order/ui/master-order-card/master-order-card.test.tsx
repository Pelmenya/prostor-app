import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MasterOrderCard } from './master-order-card';
import { EOrderStatus } from '../../model/types/e-order-status';
import { EPaymentStatus } from '../../model/types/e-payment-status';
import { EUserRole } from '@/shared/model';
import type { TOrder } from '../../model/types/t-order';

const BASE_ORDER: TOrder = {
    id: 5,
    status: EOrderStatus.PENDING,
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
    cartState: { items: {} },
    paymentStatus: EPaymentStatus.FREE,
    totalAmount: 0,
    currency: 'RUB',
};

describe('MasterOrderCard', () => {
    it('рендерит ссылку на страницу заказа', () => {
        render(<MasterOrderCard order={BASE_ORDER} />);
        expect(screen.getByRole('link')).toHaveAttribute('href', '/master/orders/5');
    });

    it('показывает id заказа в шапке', () => {
        render(<MasterOrderCard order={BASE_ORDER} />);
        expect(screen.getByText(/Заказ #5/)).toBeInTheDocument();
    });

    it('показывает имя клиента когда client задан', () => {
        const order: TOrder = {
            ...BASE_ORDER,
            client: {
                id: 1,
                uuid: 'uuid-1',
                first_name: 'Анна',
                last_name: 'Смирнова',
                role: EUserRole.CLIENT,
                is_auth: true,
            },
        };
        render(<MasterOrderCard order={order} />);
        expect(screen.getByText('Анна Смирнова')).toBeInTheDocument();
    });

    it('не показывает имя клиента когда client не задан', () => {
        render(<MasterOrderCard order={BASE_ORDER} />);
        expect(screen.queryByText(/Смирнова/)).not.toBeInTheDocument();
    });

    it('показывает адрес когда realEstate задан', () => {
        const order: TOrder = {
            ...BASE_ORDER,
            realEstate: { id: 10, address: 'ул. Пушкина, 1' },
        };
        render(<MasterOrderCard order={order} />);
        expect(screen.getByText('ул. Пушкина, 1')).toBeInTheDocument();
    });

    it('не показывает адрес когда realEstate не задан', () => {
        render(<MasterOrderCard order={BASE_ORDER} />);
        expect(screen.queryByText(/ул\./)).not.toBeInTheDocument();
    });

    it('показывает дату выезда когда scheduledDate задан', () => {
        const order: TOrder = {
            ...BASE_ORDER,
            scheduledDate: {
                date: '2026-05-10',
                startHour: 9,
                startMinute: 0,
                endHour: 11,
                endMinute: 0,
            },
        };
        render(<MasterOrderCard order={order} />);
        expect(screen.getByText(/10 мая 2026/)).toBeInTheDocument();
    });

    it('не показывает дату выезда когда scheduledDate не задан', () => {
        render(<MasterOrderCard order={BASE_ORDER} />);
        expect(screen.queryByText(/Дата выезда/)).not.toBeInTheDocument();
    });
});
