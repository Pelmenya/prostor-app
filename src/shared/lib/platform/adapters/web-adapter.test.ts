import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebAdapter } from './web-adapter';
import { useAuthStore } from '@/shared/lib';

describe('WebAdapter', () => {
    let adapter: WebAdapter;

    beforeEach(() => {
        adapter = new WebAdapter();
    });

    afterEach(() => {
        // Сбрасываем store, чтобы токен не утёк в другие тесты
        useAuthStore.getState().logout();
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

    it('с JWT в store — возвращает Bearer <accessToken>', () => {
        useAuthStore.setState({
            accessToken: 'abc123',
            refreshToken: 'r',
            isAuthenticated: true,
        });

        expect(adapter.getAuthHeader()).toBe('Bearer abc123');
    });

    it('после logout() — заголовок снова null', () => {
        useAuthStore.setState({
            accessToken: 'abc123',
            refreshToken: 'r',
            isAuthenticated: true,
        });
        expect(adapter.getAuthHeader()).toBe('Bearer abc123');

        useAuthStore.getState().logout();

        expect(adapter.getAuthHeader()).toBeNull();
    });
});
