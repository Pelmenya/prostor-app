import { describe, it, expect } from 'vitest';
import { formatUserInitials } from './format-user-initials';

describe('formatUserInitials', () => {
    it('возвращает инициалы из имени и фамилии', () => {
        expect(formatUserInitials('Иван', 'Петров')).toBe('ИП');
    });

    it('возвращает только первый инициал если фамилия не передана', () => {
        expect(formatUserInitials('Иван')).toBe('И');
    });

    it('возвращает только второй инициал если имя не передано', () => {
        expect(formatUserInitials(undefined, 'Петров')).toBe('П');
    });

    it('возвращает "?" если оба аргумента не переданы', () => {
        expect(formatUserInitials()).toBe('?');
    });

    it('возвращает "?" если оба аргумента пустые строки', () => {
        expect(formatUserInitials('', '')).toBe('?');
    });

    it('возвращает "?" если оба аргумента undefined', () => {
        expect(formatUserInitials(undefined, undefined)).toBe('?');
    });

    it('берёт только первый символ', () => {
        expect(formatUserInitials('Александр', 'Николаевич')).toBe('АН');
    });
});
