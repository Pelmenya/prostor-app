import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatMessageDate } from './format-message-date';

describe('formatMessageDate', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-04T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('сегодня → «Сегодня»', () => {
        expect(formatMessageDate('2026-06-04T08:00:00Z')).toBe('Сегодня');
    });

    it('вчера → «Вчера»', () => {
        expect(formatMessageDate('2026-06-03T10:00:00Z')).toBe('Вчера');
    });

    it('другая дата → «день месяц» на русском', () => {
        const result = formatMessageDate('2026-05-15T10:00:00Z');
        expect(result).toMatch(/15 мая/i);
    });

    it('принимает объект Date', () => {
        expect(formatMessageDate(new Date('2026-06-04T09:00:00Z'))).toBe('Сегодня');
    });

    it('прошлый год → день и месяц без года', () => {
        const result = formatMessageDate('2025-01-10T00:00:00Z');
        expect(result).toMatch(/10 января/i);
    });
});
