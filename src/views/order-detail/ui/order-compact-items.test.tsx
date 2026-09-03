import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { EServiceCategory } from '@/shared/model';
import type { TCartItem } from '@/shared/model';
import { OrderCompactItems } from './order-compact-items';

const makeItem = (id: string, name: string): TCartItem => ({
    product: { id, name },
    count: 1,
    price: 3000,
    selectedForCheckout: true,
    services: {},
});

const makeItemWithService = (id: string): TCartItem => ({
    product: { id, name: 'Фильтр' },
    count: 1,
    price: 3000,
    selectedForCheckout: true,
    services: {
        svc1: {
            serviceInfo: {
                id: 'svc1',
                name: 'Монтаж системы',
                category: EServiceCategory.MONTAZH,
            },
            count: 1,
            price: 1000,
            checked: true,
            selectedForCheckout: true,
        },
    },
});

describe('OrderCompactItems', () => {
    it('возвращает null когда items пустой', () => {
        const { container } = render(
            <OrderCompactItems items={[]} imageUrls={{}} loadingIds={new Set()} />,
        );
        expect(container.firstChild).toBeNull();
    });

    it('возвращает null когда все товары с count=0', () => {
        const { container } = render(
            <OrderCompactItems
                items={[{ ...makeItem('p1', 'Товар'), count: 0 }]}
                imageUrls={{}}
                loadingIds={new Set()}
            />,
        );
        expect(container.firstChild).toBeNull();
    });

    it('рендерит кнопку для открытия содержимого', () => {
        render(
            <OrderCompactItems
                items={[makeItem('p1', 'Фильтр')]}
                imageUrls={{}}
                loadingIds={new Set()}
            />,
        );
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('показывает название товара в модалке после клика', async () => {
        render(
            <OrderCompactItems
                items={[makeItem('p1', 'Фильтр воды')]}
                imageUrls={{}}
                loadingIds={new Set()}
            />,
        );
        await userEvent.click(screen.getByRole('button'));
        expect(screen.getByText('Содержимое заказа')).toBeInTheDocument();
        expect(screen.getByText('Фильтр воды')).toBeInTheDocument();
    });

    it('показывает услугу в модалке после клика', async () => {
        render(
            <OrderCompactItems
                items={[makeItemWithService('p1')]}
                imageUrls={{}}
                loadingIds={new Set()}
            />,
        );
        await userEvent.click(screen.getByRole('button'));
        expect(screen.getByText('Монтаж системы')).toBeInTheDocument();
    });

    it('не показывает неактивную услугу (checked=false) в модалке', async () => {
        const item: TCartItem = {
            product: { id: 'p1', name: 'Фильтр' },
            count: 1,
            price: 2000,
            selectedForCheckout: true,
            services: {
                svc1: {
                    serviceInfo: {
                        id: 'svc1',
                        name: 'Скрытая услуга',
                        category: EServiceCategory.MONTAZH,
                    },
                    count: 1,
                    price: 500,
                    checked: false,
                    selectedForCheckout: false,
                },
            },
        };
        render(<OrderCompactItems items={[item]} imageUrls={{}} loadingIds={new Set()} />);
        await userEvent.click(screen.getByRole('button'));
        expect(screen.queryByText('Скрытая услуга')).not.toBeInTheDocument();
    });
});
