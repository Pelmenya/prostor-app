import { describe, expect, it } from 'vitest';
import { getDepartureBasisLabel } from './get-departure-basis-label';
import { EDepartureBasis } from '../model/e-departure-basis';

describe('getDepartureBasisLabel', () => {
    it('возвращает подпись для OWN_ADDRESS', () => {
        expect(getDepartureBasisLabel(EDepartureBasis.OWN_ADDRESS)).toBe('от адреса');
    });

    it('возвращает подпись для NEAREST_STORE', () => {
        expect(getDepartureBasisLabel(EDepartureBasis.NEAREST_STORE)).toBe('от ближайшего склада');
    });
});
