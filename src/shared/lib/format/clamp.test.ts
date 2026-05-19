import { describe, expect, it } from 'vitest';
import { clamp } from './clamp';

describe('clamp', () => {
    it('возвращает значение внутри диапазона без изменений', () => {
        expect(clamp(5, 0, 10)).toBe(5);
    });

    it('возвращает min при значении меньше нижней границы', () => {
        expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('возвращает max при значении больше верхней границы', () => {
        expect(clamp(15, 0, 10)).toBe(10);
    });

    it('возвращает min при совпадении с нижней границей', () => {
        expect(clamp(0, 0, 10)).toBe(0);
    });

    it('возвращает max при совпадении с верхней границей', () => {
        expect(clamp(10, 0, 10)).toBe(10);
    });
});
