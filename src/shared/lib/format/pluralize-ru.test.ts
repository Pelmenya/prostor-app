import { describe, expect, it } from 'vitest';
import { pluralizeRu } from './pluralize-ru';

const FORMS: [string, string, string] = ['день', 'дня', 'дней'];

describe('pluralizeRu', () => {
    it('1 → именительный падеж единственного числа', () => {
        expect(pluralizeRu(1, FORMS)).toBe('день');
    });

    it('2 → родительный падеж единственного числа', () => {
        expect(pluralizeRu(2, FORMS)).toBe('дня');
    });

    it('5 → родительный падеж множественного числа', () => {
        expect(pluralizeRu(5, FORMS)).toBe('дней');
    });

    it('11 → исключение: родительный мн. ч. (не "день")', () => {
        expect(pluralizeRu(11, FORMS)).toBe('дней');
    });

    it('12 → исключение: родительный мн. ч. (не "дня")', () => {
        expect(pluralizeRu(12, FORMS)).toBe('дней');
    });

    it('21 → как 1: именительный ед. ч.', () => {
        expect(pluralizeRu(21, FORMS)).toBe('день');
    });

    it('22 → как 2: родительный ед. ч.', () => {
        expect(pluralizeRu(22, FORMS)).toBe('дня');
    });

    it('111 → исключение: родительный мн. ч.', () => {
        expect(pluralizeRu(111, FORMS)).toBe('дней');
    });

    it('0 → родительный мн. ч.', () => {
        expect(pluralizeRu(0, FORMS)).toBe('дней');
    });
});
