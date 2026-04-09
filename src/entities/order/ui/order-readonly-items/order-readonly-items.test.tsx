import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EServiceCategory } from '@/shared/model';
import type { TCartItem } from '@/shared/model';
import { OrderReadonlyItems } from './order-readonly-items';

const makeItem = (id: string, name: string, price: number, count: number): TCartItem => ({
    product: { id, name },
    count,
    price,
    selectedForCheckout: true,
    services: {},
});

const makeItemWithService = (id: string): TCartItem => ({
    product: { id, name: 'Фильтр воды' },
    count: 2,
    price: 5000,
    selectedForCheckout: true,
    services: {
        svc1: {
            serviceInfo: {
                id: 'svc1',
                name: 'Монтаж фильтра',
                category: EServiceCategory.MONTAZH,
            },
            count: 1,
            price: 1500,
            checked: true,
            selectedForCheckout: true,
        },
    },
});

describe('OrderReadonlyItems', () => {
    it('возвращает null когда items пустой', () => {
        const { container } = render(
            <OrderReadonlyItems items={{}} imageUrls={{}} loadingIds={new Set()} />,
        );
        expect(container.firstChild).toBeNull();
    });

    it('возвращает null когда все товары с count=0', () => {
        const { container } = render(
            <OrderReadonlyItems
                items={{ p1: makeItem('p1', 'Товар', 1000, 0) }}
                imageUrls={{}}
                loadingIds={new Set()}
            />,
        );
        expect(container.firstChild).toBeNull();
    });

    it('показывает название товара', () => {
        render(
            <OrderReadonlyItems
                items={{ p1: makeItem('p1', 'Фильтр воды', 3000, 1) }}
                imageUrls={{}}
                loadingIds={new Set()}
            />,
        );
        expect(screen.getByText('Фильтр воды')).toBeInTheDocument();
    });

    it('показывает количество товара', () => {
        render(
            <OrderReadonlyItems
                items={{ p1: makeItem('p1', 'Фильтр', 3000, 3) }}
                imageUrls={{}}
                loadingIds={new Set()}
            />,
        );
        expect(screen.getByText('x3')).toBeInTheDocument();
    });

    it('показывает активную услугу с checked=true', () => {
        render(
            <OrderReadonlyItems
                items={{ p1: makeItemWithService('p1') }}
                imageUrls={{}}
                loadingIds={new Set()}
            />,
        );
        expect(screen.getByText('Монтаж фильтра')).toBeInTheDocument();
    });

    it('не показывает услугу с checked=false', () => {
        render(
            <OrderReadonlyItems
                items={{
                    p1: {
                        ...makeItem('p1', 'Фильтр', 1000, 1),
                        services: {
                            svc1: {
                                serviceInfo: {
                                    id: 'svc1',
                                    name: 'Монтаж',
                                    category: EServiceCategory.MONTAZH,
                                },
                                count: 1,
                                price: 500,
                                checked: false,
                                selectedForCheckout: false,
                            },
                        },
                    },
                }}
                imageUrls={{}}
                loadingIds={new Set()}
            />,
        );
        expect(screen.queryByText('Монтаж')).not.toBeInTheDocument();
    });

    it('не показывает услугу с count=0', () => {
        render(
            <OrderReadonlyItems
                items={{
                    p1: {
                        ...makeItem('p1', 'Фильтр', 1000, 1),
                        services: {
                            svc1: {
                                serviceInfo: {
                                    id: 'svc1',
                                    name: 'Монтаж',
                                    category: EServiceCategory.MONTAZH,
                                },
                                count: 0,
                                price: 500,
                                checked: true,
                                selectedForCheckout: true,
                            },
                        },
                    },
                }}
                imageUrls={{}}
                loadingIds={new Set()}
            />,
        );
        expect(screen.queryByText('Монтаж')).not.toBeInTheDocument();
    });

    it('показывает несколько товаров', () => {
        render(
            <OrderReadonlyItems
                items={{
                    p1: makeItem('p1', 'Фильтр магистральный', 2000, 1),
                    p2: makeItem('p2', 'Картридж PP', 500, 3),
                }}
                imageUrls={{}}
                loadingIds={new Set()}
            />,
        );
        expect(screen.getByText('Фильтр магистральный')).toBeInTheDocument();
        expect(screen.getByText('Картридж PP')).toBeInTheDocument();
    });
});
