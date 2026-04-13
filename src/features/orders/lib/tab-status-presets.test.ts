import { describe, it, expect } from 'vitest';
import { EOrderStatus } from '@/entities/order';
import { TAB_STATUS_PRESETS } from './tab-status-presets';

describe('TAB_STATUS_PRESETS', () => {
    it('actual содержит незавершённые статусы', () => {
        expect(TAB_STATUS_PRESETS.actual).toContain(EOrderStatus.PENDING);
        expect(TAB_STATUS_PRESETS.actual).toContain(EOrderStatus.CONFIRMED);
        expect(TAB_STATUS_PRESETS.actual).toContain(EOrderStatus.IN_PROGRESS);
        expect(TAB_STATUS_PRESETS.actual).not.toContain(EOrderStatus.COMPLETED);
        expect(TAB_STATUS_PRESETS.actual).not.toContain(EOrderStatus.CANCELLED);
    });

    it('completed содержит завершённые статусы', () => {
        expect(TAB_STATUS_PRESETS.completed).toContain(EOrderStatus.COMPLETED);
        expect(TAB_STATUS_PRESETS.completed).toContain(EOrderStatus.CANCELLED);
        expect(TAB_STATUS_PRESETS.completed).not.toContain(EOrderStatus.PENDING);
    });

    it('все статусы покрыты пресетами', () => {
        const allStatuses = Object.values(EOrderStatus);
        const covered = [...TAB_STATUS_PRESETS.actual, ...TAB_STATUS_PRESETS.completed];
        for (const status of allStatuses) {
            expect(covered).toContain(status);
        }
    });
});
