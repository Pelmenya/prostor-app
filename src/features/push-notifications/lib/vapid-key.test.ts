import { describe, it, expect } from 'vitest';
import { urlBase64ToUint8Array } from './vapid-key';

describe('urlBase64ToUint8Array', () => {
    it('конвертирует base64url строку в Uint8Array', () => {
        const result = urlBase64ToUint8Array('AQID');
        expect(result).toBeInstanceOf(Uint8Array);
        expect(Array.from(result)).toEqual([1, 2, 3]);
    });

    it('обрабатывает URL-safe символы (- и _)', () => {
        const result = urlBase64ToUint8Array('-_8');
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('добавляет padding при необходимости', () => {
        const result = urlBase64ToUint8Array('AQ');
        expect(result).toBeInstanceOf(Uint8Array);
        expect(Array.from(result)).toEqual([1]);
    });

    it('корректно обрабатывает реальный VAPID ключ (65 байт)', () => {
        const vapidKey =
            'BGU0QB_vbfV2ft90wgzHpDgz8Qo4SDMLvPGTj3lNmjEfmYgazaxTRrvxwaKgp3_3fowwyNND-FFl34z_LX2M3t0';
        const result = urlBase64ToUint8Array(vapidKey);
        expect(result.length).toBe(65);
    });

    it('обрабатывает строки без padding разной длины', () => {
        expect(() => urlBase64ToUint8Array('AQIDBA')).not.toThrow();
    });
});
