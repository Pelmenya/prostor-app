'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/shared/lib/platform';
import { useAuthStore } from '@/shared/lib';
import {
    useCartStore,
    useUpdateCart,
    toBackendCartState,
    fromBackendCartState,
} from '@/entities/cart';
import { apiClient } from '@/shared/api';
import { mergeCartItems } from './merge-cart-items';
import type { TBackendCartState, TCartItem } from '@/entities/cart';

const DEBOUNCE_MS = 300;

/**
 * Единый хук синхронизации корзины с бэкендом.
 *
 * Потоки:
 * - Гость (isGuest: true)  → ничего, persist хватает
 * - Залогинен               → subscribe на store, debounce 300ms → POST /cart
 * - Логин (гость → auth)   → GET /cart → merge(local, server) → POST /cart
 * - Logout (auth → гость)  → setIsGuest(true), store остаётся в localStorage
 */
export function useCartBackendSync() {
    const { isAuthenticated, authHeader } = useAuth();
    const updateCart = useUpdateCart();

    const updateCartRef = useRef(updateCart);
    const authHeaderRef = useRef(authHeader);

    useEffect(() => {
        updateCartRef.current = updateCart;
        authHeaderRef.current = authHeader;
    });

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    /** Auth header захваченный в момент изменения корзины (пока токен жив) */
    const pendingAuthRef = useRef<string | null>(null);
    const skipNextSyncRef = useRef(false);
    const mergedRef = useRef(false);
    const prevAuthRef = useRef(false);

    useEffect(() => {
        const wasAuth = prevAuthRef.current;
        prevAuthRef.current = isAuthenticated;

        // ── Logout: auth → guest ──
        if (wasAuth && !isAuthenticated) {
            // Flush pending debounce с захваченным ранее auth header
            if (timerRef.current && pendingAuthRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
                const { items } = useCartStore.getState();
                const body = toBackendCartState(items);
                const auth = pendingAuthRef.current;
                pendingAuthRef.current = null;
                // fire-and-forget — токен ещё валиден (JWT не отзывается мгновенно)
                apiClient('/cart', { method: 'POST', body, auth }).catch(() => {});
            }
            mergedRef.current = false;
            const { isGuest, setIsGuest } = useCartStore.getState();
            if (!isGuest) setIsGuest(true);
            return;
        }

        // ── Login: guest → auth (merge один раз) ──
        if (!isAuthenticated || mergedRef.current) return;
        mergedRef.current = true;

        const controller = new AbortController();

        const run = async () => {
            // Ждём гидратацию persist
            if (!useCartStore.persist.hasHydrated()) {
                await new Promise<void>((resolve) => {
                    const unsub = useCartStore.persist.onFinishHydration(() => {
                        unsub();
                        resolve();
                    });
                });
            }

            if (controller.signal.aborted) return;

            const {
                items: localItems,
                isGuest,
                replaceItems,
                setIsGuest,
            } = useCartStore.getState();

            // Уже залогинен (перезагрузка) — не перезатираем, sync подхватит
            if (!isGuest) return;

            // Получаем серверную корзину
            // apiClient напрямую, т.к. useApi() нельзя вызвать в async функции
            let serverItems: Record<string, TCartItem> = {};
            try {
                const header = authHeaderRef.current;
                if (header) {
                    const serverCart = await apiClient<TBackendCartState>('/cart', {
                        auth: header,
                    });
                    serverItems = fromBackendCartState(serverCart);
                }
            } catch {
                // GET /cart недоступен — не мержим, только переключаем режим.
                // Debounce sync подхватит при следующем изменении корзины.
                setIsGuest(false);
                return;
            }

            if (controller.signal.aborted) return;

            const hasLocal = Object.keys(localItems).length > 0;
            const hasServer = Object.keys(serverItems).length > 0;

            if (hasLocal) {
                const merged = mergeCartItems(localItems, serverItems);
                skipNextSyncRef.current = true;
                replaceItems(merged);
                setIsGuest(false);
                updateCartRef.current.mutate(toBackendCartState(merged));
            } else if (hasServer) {
                skipNextSyncRef.current = true;
                replaceItems(serverItems);
                setIsGuest(false);
            } else {
                setIsGuest(false);
            }
        };

        run();

        return () => {
            controller.abort();
        };
    }, [isAuthenticated]);

    // ── Debounce sync: store → POST /cart ──
    useEffect(() => {
        const unsubscribe = useCartStore.subscribe((state, prevState) => {
            if (state.isGuest) return;
            if (state.items === prevState.items) return;

            if (skipNextSyncRef.current) {
                skipNextSyncRef.current = false;
                return;
            }

            // Захватываем auth header СЕЙЧАС (пока токен жив)
            const token = useAuthStore.getState().accessToken;
            pendingAuthRef.current = token ? `Bearer ${token}` : null;

            if (timerRef.current) clearTimeout(timerRef.current);

            timerRef.current = setTimeout(() => {
                const auth = pendingAuthRef.current;
                if (!auth) return;
                apiClient('/cart', {
                    method: 'POST',
                    body: toBackendCartState(state.items),
                    auth,
                }).catch(() => {});
                pendingAuthRef.current = null;
            }, DEBOUNCE_MS);
        });

        return () => {
            unsubscribe();
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);
}
