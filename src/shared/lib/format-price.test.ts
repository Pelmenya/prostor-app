import { describe, it, expect } from 'vitest';
import { formatPrice } from './format-price';

describe('formatPrice', () => {
    it('форматирует копейки в рубли', () => {
        // Intl использует narrow no-break space (U+202F) как разделитель
        expect(formatPrice(150000)).toContain('1');
        expect(formatPrice(150000)).toContain('500');
        expect(formatPrice(150000)).toContain('₽');
    });

    it('форматирует 0', () => {
        expect(formatPrice(0)).toContain('0');
        expect(formatPrice(0)).toContain('₽');
    });

    it('форматирует крупные суммы', () => {
        expect(formatPrice(10000000)).toContain('100');
        expect(formatPrice(10000000)).toContain('000');
        expect(formatPrice(10000000)).toContain('₽');
    });

    it('корректно делит на 100', () => {
        // 50000 копеек = 500 рублей
        expect(formatPrice(50000)).toContain('500');
    });
});
