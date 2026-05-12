import { describe, it, expect } from 'vitest';
import { getMasterTransition, MASTER_STATUS_TRANSITIONS } from './order-status-machine';
import { EOrderStatus } from '../model/types/e-order-status';

describe('getMasterTransition', () => {
    it('PENDING → CONFIRMED', () => {
        const t = getMasterTransition(EOrderStatus.PENDING);
        expect(t?.next).toBe(EOrderStatus.CONFIRMED);
        expect(t?.label).toBe('Принять заказ');
    });

    it('CONFIRMED → IN_PROGRESS', () => {
        const t = getMasterTransition(EOrderStatus.CONFIRMED);
        expect(t?.next).toBe(EOrderStatus.IN_PROGRESS);
        expect(t?.label).toBe('Начать работу');
    });

    it('IN_PROGRESS → COMPLETED', () => {
        const t = getMasterTransition(EOrderStatus.IN_PROGRESS);
        expect(t?.next).toBe(EOrderStatus.COMPLETED);
        expect(t?.label).toBe('Завершить заказ');
    });

    it('COMPLETED — нет перехода', () => {
        expect(getMasterTransition(EOrderStatus.COMPLETED)).toBeNull();
    });

    it('CANCELLED — нет перехода', () => {
        expect(getMasterTransition(EOrderStatus.CANCELLED)).toBeNull();
    });

    it('все переходы имеют confirm-текст', () => {
        Object.values(MASTER_STATUS_TRANSITIONS).forEach((t) => {
            expect(t?.confirm).toBeTruthy();
        });
    });
});
