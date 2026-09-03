import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/shared/lib';
import { useLogout } from './use-logout';
import { webLogout } from '../api/auth-api';

const mockPush = vi.fn();
let mockPathname = '/orders';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    usePathname: () => mockPathname,
}));

vi.mock('../api/auth-api', () => ({
    webLogout: vi.fn(),
}));

function seedAuthenticatedSession() {
    useAuthStore.setState({
        accessToken: 'a',
        refreshToken: 'r',
        isAuthenticated: true,
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/orders';
    useAuthStore.getState().logout();
});

describe('useLogout', () => {
    it('очищает локальную сессию даже если /auth/web/logout упал по сети', async () => {
        vi.mocked(webLogout).mockRejectedValueOnce(new Error('network down'));
        seedAuthenticatedSession();

        const { result } = renderHook(() => useLogout());
        await act(() => result.current());

        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('очищает локальную сессию, когда /auth/web/logout отработал успешно', async () => {
        vi.mocked(webLogout).mockResolvedValueOnce(undefined);
        seedAuthenticatedSession();

        const { result } = renderHook(() => useLogout());
        await act(() => result.current());

        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(useAuthStore.getState().accessToken).toBeNull();
        expect(webLogout).toHaveBeenCalledWith('a', 'r');
    });

    it('падение onBeforeLogout не блокирует очистку сессии', async () => {
        vi.mocked(webLogout).mockResolvedValueOnce(undefined);
        seedAuthenticatedSession();

        const { result } = renderHook(() => useLogout());
        const onBeforeLogout = vi.fn().mockRejectedValue(new Error('flush упал'));
        await act(() => result.current(onBeforeLogout));

        expect(onBeforeLogout).toHaveBeenCalledTimes(1);
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('редиректит на / только с приватной страницы', async () => {
        vi.mocked(webLogout).mockResolvedValueOnce(undefined);
        seedAuthenticatedSession();
        mockPathname = '/orders';

        const { result } = renderHook(() => useLogout());
        await act(() => result.current());

        expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('не редиректит с публичной страницы', async () => {
        vi.mocked(webLogout).mockResolvedValueOnce(undefined);
        seedAuthenticatedSession();
        mockPathname = '/catalog';

        const { result } = renderHook(() => useLogout());
        await act(() => result.current());

        expect(mockPush).not.toHaveBeenCalled();
    });
});
