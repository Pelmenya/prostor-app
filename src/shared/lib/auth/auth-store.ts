'use client';

import { create } from 'zustand';
import type { TUser } from '@/shared/model';

const ACCESS_TOKEN_KEY = 'prostor_access_token';
const REFRESH_TOKEN_KEY = 'prostor_refresh_token';
const ACCESS_TOKEN_COOKIE = 'access_token';

type TAuthStore = {
    accessToken: string | null;
    refreshToken: string | null;
    user: TUser | null;
    isAuthenticated: boolean;
    setTokens(access: string, refresh: string): void;
    setUser(user: TUser): void;
    logout(): void;
    hydrate(): void;
};

function setCookie(name: string, value: string, days: number) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
}

function deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export const useAuthStore = create<TAuthStore>((set) => ({
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,

    setTokens(access: string, refresh: string) {
        localStorage.setItem(ACCESS_TOKEN_KEY, access);
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
        setCookie(ACCESS_TOKEN_COOKIE, access, 1);
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
    },

    setUser(user: TUser) {
        set({ user });
    },

    logout() {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        deleteCookie(ACCESS_TOKEN_COOKIE);
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
    },

    hydrate() {
        if (typeof window === 'undefined') return;
        const access = localStorage.getItem(ACCESS_TOKEN_KEY);
        const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (access && refresh) {
            setCookie(ACCESS_TOKEN_COOKIE, access, 1);
            set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
        }
    },
}));
