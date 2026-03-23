import { describe, it, expect } from 'vitest';
import { formatDateRu } from './format-date-ru';

describe('formatDateRu', () => {
    it('форматирует дату ISO в русский формат', () => {
        const result = formatDateRu('2026-01-15');
        expect(result).toContain('2026');
        expect(result).toContain('15');
    });

    it('форматирует дату с временем', () => {
        const result = formatDateRu('2026-03-05T12:00:00Z');
        expect(result).toContain('2026');
    });
});
