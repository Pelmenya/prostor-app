import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth-store';
import type { TUser } from '@/shared/model';

const mockUser: TUser = {
    id: 1,
    uuid: 'uuid-1234',
    first_name: 'Иван',
    last_name: 'Петров',
    phone: '79001234567',
    email: 'ivan@example.com',
    username: 'ivan',
    role: 'CLIENT',
    is_auth: true,
};

beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
    });
});

describe('useAuthStore', () => {
    describe('setTokens', () => {
        it('сохраняет токены и устанавливает isAuthenticated', () => {
            useAuthStore.getState().setTokens('access-123', 'refresh-456');
            const state = useAuthStore.getState();
            expect(state.accessToken).toBe('access-123');
            expect(state.refreshToken).toBe('refresh-456');
            expect(state.isAuthenticated).toBe(true);
            expect(localStorage.getItem('prostor_access_token')).toBe('access-123');
            expect(localStorage.getItem('prostor_refresh_token')).toBe('refresh-456');
        });
    });

    describe('setUser', () => {
        it('сохраняет пользователя в стор и localStorage', () => {
            useAuthStore.getState().setUser(mockUser);
            expect(useAuthStore.getState().user).toEqual(mockUser);
            expect(JSON.parse(localStorage.getItem('prostor_user')!)).toEqual(mockUser);
        });
    });

    describe('logout', () => {
        it('очищает стор и localStorage', () => {
            useAuthStore.getState().setTokens('access-123', 'refresh-456');
            useAuthStore.getState().setUser(mockUser);

            useAuthStore.getState().logout();

            const state = useAuthStore.getState();
            expect(state.accessToken).toBeNull();
            expect(state.refreshToken).toBeNull();
            expect(state.user).toBeNull();
            expect(state.isAuthenticated).toBe(false);
            expect(localStorage.getItem('prostor_access_token')).toBeNull();
            expect(localStorage.getItem('prostor_refresh_token')).toBeNull();
            expect(localStorage.getItem('prostor_user')).toBeNull();
        });

        it('не падает если localStorage пустой', () => {
            expect(() => useAuthStore.getState().logout()).not.toThrow();
        });
    });

    describe('setTokens → logout → setTokens', () => {
        it('корректно переавторизует пользователя', () => {
            useAuthStore.getState().setTokens('old-access', 'old-refresh');
            useAuthStore.getState().logout();
            useAuthStore.getState().setTokens('new-access', 'new-refresh');

            const state = useAuthStore.getState();
            expect(state.isAuthenticated).toBe(true);
            expect(state.accessToken).toBe('new-access');
        });
    });
});
