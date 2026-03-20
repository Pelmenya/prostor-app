import { describe, it, expect } from 'vitest';
import { extractErrorMessage } from './extract-error-message';

describe('extractErrorMessage', () => {
    it('string message', () => {
        expect(extractErrorMessage({ message: 'error text' }, 'fallback')).toBe('error text');
    });

    it('array message — берёт первый', () => {
        expect(extractErrorMessage({ message: ['first', 'second'] }, 'fallback')).toBe('first');
    });

    it('пустой массив → fallback', () => {
        expect(extractErrorMessage({ message: [] }, 'fallback')).toBe('fallback');
    });

    it('null data → fallback', () => {
        expect(extractErrorMessage(null, 'fallback')).toBe('fallback');
    });

    it('без message → fallback', () => {
        expect(extractErrorMessage({ error: 'Bad Request' }, 'fallback')).toBe('fallback');
    });

    it('message — массив объектов → fallback', () => {
        expect(extractErrorMessage({ message: [{ constraints: {} }] }, 'fallback')).toBe(
            'fallback',
        );
    });
});
