import { describe, it, expect } from 'vitest';
import { EOrderStatus } from '../model/types/e-order-status';
import { STATUS_TEXT } from './status-text';

describe('STATUS_TEXT', () => {
    it('содержит текст для каждого статуса', () => {
        const statuses = Object.values(EOrderStatus);
        for (const status of statuses) {
            expect(STATUS_TEXT[status]).toBeDefined();
            expect(typeof STATUS_TEXT[status]).toBe('string');
        }
    });

    it('маппинг статусов корректен', () => {
        expect(STATUS_TEXT[EOrderStatus.PENDING]).toBe('Новый');
        expect(STATUS_TEXT[EOrderStatus.CONFIRMED]).toBe('Подтвержден');
        expect(STATUS_TEXT[EOrderStatus.IN_PROGRESS]).toBe('Запланирован');
        expect(STATUS_TEXT[EOrderStatus.COMPLETED]).toBe('Выполнен');
        expect(STATUS_TEXT[EOrderStatus.CANCELLED]).toBe('Отменен');
    });
});
