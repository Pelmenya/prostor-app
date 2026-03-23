import { describe, it, expect } from 'vitest';
import { urlBase64ToUint8Array } from './vapid-key';

describe('urlBase64ToUint8Array', () => {
    it('конвертирует base64url строку в Uint8Array', () => {
        // 'AQID' = [1, 2, 3] в base64
        const result = urlBase64ToUint8Array('AQID');
        expect(result).toBeInstanceOf(Uint8Array);
        expect(Array.from(result)).toEqual([1, 2, 3]);
    });

    it('обрабатывает URL-safe символы (- и _)', () => {
        // '-_' в base64url = '+/' в стандартном base64
        const result = urlBase64ToUint8Array('-_8');
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('добавляет padding при необходимости', () => {
        // Без padding — длина не кратна 4
        const result = urlBase64ToUint8Array('AQ');
        expect(result).toBeInstanceOf(Uint8Array);
        expect(Array.from(result)).toEqual([1]);
    });
});
