import { describe, it, expect, vi, beforeEach } from 'vitest';
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

    it('без dev-токена — не аутентифицирован', async () => {
        await adapter.init();
        expect(adapter.isAuthenticated()).toBe(false);
        expect(adapter.getAuthHeader()).toBeNull();
        expect(adapter.getUser()).toBeNull();
    });

    it('с dev-токеном в development — аутентифицирован', async () => {
        vi.stubEnv('NODE_ENV', 'development');
        vi.stubEnv('NEXT_PUBLIC_DEV_TOKEN', 'dev:12345');

        const devAdapter = new WebAdapter();
        await devAdapter.init();

        expect(devAdapter.isAuthenticated()).toBe(true);
        expect(devAdapter.getAuthHeader()).toBe('Bearer dev:12345');

        vi.unstubAllEnvs();
    });

    it('с dev-токеном в production — НЕ аутентифицирован', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        vi.stubEnv('NEXT_PUBLIC_DEV_TOKEN', 'dev:12345');

        const prodAdapter = new WebAdapter();
        await prodAdapter.init();

        expect(prodAdapter.isAuthenticated()).toBe(false);
        expect(prodAdapter.getAuthHeader()).toBeNull();

        vi.unstubAllEnvs();
    });
});
