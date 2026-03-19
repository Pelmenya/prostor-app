import { describe, it, expect } from 'vitest';
import { MaxAdapter } from './max-adapter';

describe('MaxAdapter', () => {
    it('платформа = max', () => {
        const adapter = new MaxAdapter();
        expect(adapter.platform).toBe('max');
    });

    it('после init — isReady, но не аутентифицирован (заглушка)', async () => {
        const adapter = new MaxAdapter();
        await adapter.init();

        expect(adapter.isReady).toBe(true);
        expect(adapter.isAuthenticated()).toBe(false);
        expect(adapter.getAuthHeader()).toBeNull();
        expect(adapter.getUser()).toBeNull();
    });
});
