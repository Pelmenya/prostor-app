import { describe, it, expect } from 'vitest';
import { getSafeRedirect } from './get-safe-redirect';

describe('getSafeRedirect', () => {
    it('null → /', () => {
        expect(getSafeRedirect(null)).toBe('/');
    });

    it('пустая строка → /', () => {
        expect(getSafeRedirect('')).toBe('/');
    });

    it('валидный путь → возвращает как есть', () => {
        expect(getSafeRedirect('/catalog')).toBe('/catalog');
    });

    it('путь с query → возвращает как есть', () => {
        expect(getSafeRedirect('/cart?tab=services')).toBe('/cart?tab=services');
    });

    it('// (open redirect) → /', () => {
        expect(getSafeRedirect('//evil.com')).toBe('/');
    });

    it('абсолютный URL → /', () => {
        expect(getSafeRedirect('https://evil.com')).toBe('/');
    });

    it('относительный путь без / → /', () => {
        expect(getSafeRedirect('evil.com')).toBe('/');
    });

    it('/\\ (backslash open redirect) → /', () => {
        expect(getSafeRedirect('/\\evil.com')).toBe('/');
    });

    it('javascript: URI → /', () => {
        expect(getSafeRedirect('javascript:alert(1)')).toBe('/');
    });

    it('JavaScript: URI (mixed case) → /', () => {
        expect(getSafeRedirect('JavaScript:alert(1)')).toBe('/');
    });
});
