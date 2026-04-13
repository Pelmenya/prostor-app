import { describe, it, expect } from 'vitest';
import { buildSearchParams } from './build-search-params';

describe('buildSearchParams', () => {
    it('строковое значение', () => {
        expect(buildSearchParams({ foo: 'bar' })).toBe('foo=bar');
    });

    it('числовое значение', () => {
        expect(buildSearchParams({ limit: 10 })).toBe('limit=10');
    });

    it('массив — несколько одинаковых ключей', () => {
        const result = buildSearchParams({ status: ['pending', 'confirmed'] });
        expect(result).toBe('status=pending&status=confirmed');
    });

    it('пустой массив — ключ не попадает в строку', () => {
        expect(buildSearchParams({ status: [] })).toBe('');
    });

    it('undefined — ключ пропускается', () => {
        expect(buildSearchParams({ foo: undefined, bar: 'baz' })).toBe('bar=baz');
    });

    it('пустая строка — ключ пропускается', () => {
        expect(buildSearchParams({ foo: '', bar: 'baz' })).toBe('bar=baz');
    });

    it('null — добавляется как строка "null"', () => {
        expect(buildSearchParams({ cursor: null })).toBe('cursor=null');
    });

    it('несколько параметров', () => {
        const result = buildSearchParams({ limit: 10, cursor: 'abc' });
        expect(result).toBe('limit=10&cursor=abc');
    });

    it('пустой объект — пустая строка', () => {
        expect(buildSearchParams({})).toBe('');
    });
});
