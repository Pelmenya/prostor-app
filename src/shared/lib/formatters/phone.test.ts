import { describe, it, expect } from 'vitest';
import { normalizeRuPhone, formatRuPhoneForView, denormalizeViewToE164 } from './phone';

describe('normalizeRuPhone', () => {
    it('8 в начале → 7', () => {
        expect(normalizeRuPhone('89991234567')).toBe('79991234567');
    });

    it('10 цифр без кода → добавляет 7', () => {
        expect(normalizeRuPhone('9991234567')).toBe('79991234567');
    });

    it('+7 с дефисами и пробелами', () => {
        expect(normalizeRuPhone('+7 999 123-45-67')).toBe('79991234567');
    });

    it('обрезает до 11 цифр', () => {
        expect(normalizeRuPhone('799912345678888')).toBe('79991234567');
    });

    it('пустая строка', () => {
        expect(normalizeRuPhone('')).toBe('');
    });
});

describe('formatRuPhoneForView', () => {
    it('полный номер', () => {
        expect(formatRuPhoneForView('79991234567')).toBe('+7 999 123-45-67');
    });

    it('частичный ввод — 4 цифры', () => {
        expect(formatRuPhoneForView('7999')).toBe('+7 999');
    });

    it('пустая строка → +7 с пробелом', () => {
        expect(formatRuPhoneForView('')).toBe('+7');
    });
});

describe('denormalizeViewToE164', () => {
    it('маска → E.164', () => {
        expect(denormalizeViewToE164('+7 999 123-45-67')).toBe('+79991234567');
    });

    it('8 в начале → +7', () => {
        expect(denormalizeViewToE164('89991234567')).toBe('+79991234567');
    });

    it('пустая строка', () => {
        expect(denormalizeViewToE164('')).toBe('');
    });
});
