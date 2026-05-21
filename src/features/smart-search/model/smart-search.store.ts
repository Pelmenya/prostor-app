'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TSearchDoc, TSmartSearchStatus, TVisionDto } from './types';

/**
 * Smart Search store — UI state + recent queries persisted в localStorage.
 *
 * Архитектура:
 *  - isOverlayOpen / status / query / image / vision / results / error — ephemeral
 *    UI state (НЕ persist'ится, сброс на refresh)
 *  - recentQueries — persisted last 3 строки (НЕ images, чтобы не раздувать
 *    localStorage). Phase 1.5 расширим до last 10
 *
 * Мульти-клиент: см. CLAUDE.md «Мультиклиентность и синхронизация данных» —
 * recentQueries это локальный кэш UX, источник правды нет (search сам по себе
 * stateless). Sync через бэк не нужен.
 */

type TSmartSearchState = {
    // overlay control
    isOverlayOpen: boolean;
    // input state
    query: string;
    image: { dataUrl: string; mime: string; sizeBytes: number } | null;
    // request lifecycle
    status: TSmartSearchStatus;
    vision: TVisionDto | null;
    results: TSearchDoc[];
    error: string | null;
    // history (persist)
    recentQueries: string[];
};

type TSmartSearchActions = {
    openOverlay: () => void;
    closeOverlay: () => void;
    setQuery: (q: string) => void;
    setImage: (image: TSmartSearchState['image']) => void;
    clearImage: () => void;
    setStatus: (status: TSmartSearchStatus) => void;
    setResponse: (payload: { vision: TVisionDto | null; results: TSearchDoc[] }) => void;
    setError: (error: string | null) => void;
    pushRecentQuery: (q: string) => void;
    clearRecentQueries: () => void;
    resetSearch: () => void;
};

const INITIAL: Omit<TSmartSearchState, 'recentQueries'> = {
    isOverlayOpen: false,
    query: '',
    image: null,
    status: 'idle',
    vision: null,
    results: [],
    error: null,
};

const RECENT_MAX = 3;

export const useSmartSearchStore = create<TSmartSearchState & TSmartSearchActions>()(
    persist(
        (set) => ({
            ...INITIAL,
            recentQueries: [],

            openOverlay: () => set({ isOverlayOpen: true }),
            closeOverlay: () => set({ isOverlayOpen: false }),

            setQuery: (query) => set({ query }),
            setImage: (image) => set({ image }),
            clearImage: () => set({ image: null }),

            setStatus: (status) => set({ status }),
            setResponse: ({ vision, results }) =>
                set({ vision, results, status: 'success', error: null }),
            setError: (error) => set({ error, status: error ? 'error' : 'idle' }),

            pushRecentQuery: (raw) => {
                const q = raw.trim();
                if (!q) return;
                set((state) => {
                    const next = [q, ...state.recentQueries.filter((r) => r !== q)].slice(
                        0,
                        RECENT_MAX,
                    );
                    return { recentQueries: next };
                });
            },
            clearRecentQueries: () => set({ recentQueries: [] }),

            resetSearch: () =>
                set({
                    query: '',
                    image: null,
                    status: 'idle',
                    vision: null,
                    results: [],
                    error: null,
                }),
        }),
        {
            name: 'smart-search:state',
            storage: createJSONStorage(() => localStorage),
            // Persist'им только recentQueries — ephemeral UI state (overlay, query,
            // results, status, error, image) НЕ нужно сохранять между сессиями
            partialize: (state) => ({ recentQueries: state.recentQueries }),
        },
    ),
);
