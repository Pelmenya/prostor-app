import { describe, expect, it } from 'vitest';
import { pad, toTimeStr, fromTimeStr, formatDuration } from './format-time';

describe('pad', () => {
    it('добавляет ноль для однозначного числа', () => {
        expect(pad(5)).toBe('05');
    });

    it('не меняет двузначное число', () => {
        expect(pad(10)).toBe('10');
    });
});

describe('toTimeStr', () => {
    it('форматирует время с нулями', () => {
        expect(toTimeStr(9, 0)).toBe('09:00');
    });

    it('форматирует время без нулей', () => {
        expect(toTimeStr(18, 30)).toBe('18:30');
    });
});

describe('fromTimeStr', () => {
    it('парсит строку времени', () => {
        expect(fromTimeStr('09:30')).toEqual({ h: 9, m: 30 });
    });

    it('парсит строку с минутами без часов', () => {
        expect(fromTimeStr('00:45')).toEqual({ h: 0, m: 45 });
    });
});

describe('formatDuration', () => {
    it('форматирует только минуты', () => {
        expect(formatDuration(600)).toBe('10 мин');
    });

    it('форматирует часы и минуты', () => {
        expect(formatDuration(3900)).toBe('1 ч 5 мин');
    });

    it('форматирует ровно час', () => {
        expect(formatDuration(3600)).toBe('1 ч 0 мин');
    });
});
