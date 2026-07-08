import { describe, it, expect, beforeEach } from 'vitest';
import { WebAdapter } from './web-adapter';

describe('WebAdapter', () => {
    let adapter: WebAdapter;

    beforeEach(() => {
        adapter = new WebAdapter();
    });

    it('платформа = web', () => {
        expect(adapter.platform).toBe('web');
    });

    it('изначально не готов', () => {
        expect(adapter.isReady).toBe(false);
    });

    it('после init — isReady', async () => {
        await adapter.init();
        expect(adapter.isReady).toBe(true);
    });

    it('без JWT — не аутентифицирован', async () => {
        await adapter.init();
        expect(adapter.isAuthenticated()).toBe(false);
        expect(adapter.getAuthHeader()).toBeNull();
        expect(adapter.getUser()).toBeNull();
    });
});
