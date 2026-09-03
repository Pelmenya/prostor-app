import { describe, it, expect } from 'vitest';
import { getBackDestination } from './get-back-destination';

describe('getBackDestination', () => {
    describe('страницы верхнего уровня — null', () => {
        it.each(['/', '/catalog', '/orders', '/cart', '/profile', '/real-estate'])(
            '%s → null',
            (path) => {
                expect(getBackDestination(path)).toBeNull();
            },
        );

        it.each(['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'])(
            'auth %s → null',
            (path) => {
                expect(getBackDestination(path)).toBeNull();
            },
        );
    });

    describe('заказы', () => {
        it('/orders/123 → /orders', () => {
            expect(getBackDestination('/orders/123')).toBe('/orders');
        });

        it('/orders/456 → /orders', () => {
            expect(getBackDestination('/orders/456')).toBe('/orders');
        });

        it('/orders/123/chat → /orders/123', () => {
            expect(getBackDestination('/orders/123/chat')).toBe('/orders/123');
        });

        it('/orders/999/chat → /orders/999', () => {
            expect(getBackDestination('/orders/999/chat')).toBe('/orders/999');
        });
    });

    describe('каталог', () => {
        it('/catalog/abc-123 → /catalog', () => {
            expect(getBackDestination('/catalog/abc-123')).toBe('/catalog');
        });

        it('/product/xyz → router.back() (пустая строка)', () => {
            expect(getBackDestination('/product/xyz')).toBe('');
        });
    });

    describe('адреса', () => {
        it('/real-estate/add → /real-estate', () => {
            expect(getBackDestination('/real-estate/add')).toBe('/real-estate');
        });

        it('/real-estate/42 → /real-estate', () => {
            expect(getBackDestination('/real-estate/42')).toBe('/real-estate');
        });
    });

    describe('профиль', () => {
        it('/profile/personal-info → /profile', () => {
            expect(getBackDestination('/profile/personal-info')).toBe('/profile');
        });

        it('/profile/change-email → /profile', () => {
            expect(getBackDestination('/profile/change-email')).toBe('/profile');
        });

        it('/profile/change-password → /profile', () => {
            expect(getBackDestination('/profile/change-password')).toBe('/profile');
        });
    });
});
