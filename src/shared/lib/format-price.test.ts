import { describe, it, expect } from 'vitest';
import { formatPrice } from './format-price';

/** Intl использует narrow no-break space (U+202F) — нормализуем для сравнения */
function normalize(str: string): string {
    return str.replace(/\s/g, ' ');
}

describe('formatPrice', () => {
    it('форматирует копейки в рубли', () => {
        expect(normalize(formatPrice(150000))).toBe('1 500 ₽');
    });

    it('форматирует 0', () => {
        expect(normalize(formatPrice(0))).toBe('0 ₽');
    });

    it('корректно делит на 100', () => {
        expect(normalize(formatPrice(50000))).toBe('500 ₽');
    });

    it('форматирует крупные суммы с разделителями', () => {
        expect(normalize(formatPrice(10000000))).toBe('100 000 ₽');
    });

    it('округляет дробные копейки', () => {
        expect(normalize(formatPrice(99))).toBe('1 ₽');
    });

    it('форматирует отрицательные значения', () => {
        expect(normalize(formatPrice(-150000))).toBe('-1 500 ₽');
    });

    it('обрабатывает NaN', () => {
        // ru-RU Intl выводит «не число» вместо «NaN»
        expect(normalize(formatPrice(NaN))).toContain('не число');
    });
});
