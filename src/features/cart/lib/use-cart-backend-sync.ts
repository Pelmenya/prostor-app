'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/lib/platform';
import { useAuthStore } from '@/shared/lib';
import {
    useCartStore,
    useCart,
    toBackendCartState,
    fromBackendCartState,
    CART_QUERY_KEY,
} from '@/entities/cart';
import { apiClient } from '@/shared/api';
import { mergeCartItems } from './merge-cart-items';
import type { TBackendCartState, TCartItem } from '@/entities/cart';

const DEBOUNCE_MS = 300;

/** Проверяет, отличаются ли две корзины (ключи, количества товаров и услуг) */
function hasCartDiff(local: Record<string, TCartItem>, server: Record<string, TCartItem>): boolean {
    const localKeys = Object.keys(local);
    const serverKeys = Object.keys(server);
    if (localKeys.length !== serverKeys.length) return true;

    for (const id of serverKeys) {
        const l = local[id];
        const s = server[id];
        if (!l) return true;
        if (l.count !== s.count || l.price !== s.price) return true;

        // Сравниваем услуги
        const lSvcKeys = Object.keys(l.services);
        const sSvcKeys = Object.keys(s.services);
        if (lSvcKeys.length !== sSvcKeys.length) return true;
        for (const svcId of sSvcKeys) {
            const lSvc = l.services[svcId];
            const sSvc = s.services[svcId];
            if (!lSvc) return true;
            if (lSvc.count !== sSvc.count || lSvc.price !== sSvc.price) return true;
        }
    }

    return false;
}

// ── Module-level state (доступен из flushCartSync) ──
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let pendingAuth: string | null = null;

function postCart(items: Record<string, TCartItem>, auth: string): Promise<unknown> {
    return apiClient('/cart', {
        method: 'POST',
        body: toBackendCartState(items),
        auth,
    });
}

/**
 * Немедленно отправить pending изменения корзины на бэк.
 * Вызывается из useLogout() ДО webLogout (пока JWT ещё валиден на сервере).
 */
export function flushCartSync(): Promise<unknown> | undefined {
    if (pendingTimer && pendingAuth) {
        clearTimeout(pendingTimer);
        pendingTimer = null;
        const { items } = useCartStore.getState();
        const auth = pendingAuth;
        pendingAuth = null;
        return postCart(items, auth);
    }
}

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
    const queryClient = useQueryClient();

    const authHeaderRef = useRef(authHeader);
    const queryClientRef = useRef(queryClient);

    useEffect(() => {
        authHeaderRef.current = authHeader;
    }, [authHeader]);
    useEffect(() => {
        queryClientRef.current = queryClient;
    }, [queryClient]);

    const skipNextSyncRef = useRef(false);
    const mergedRef = useRef(false);
    const prevAuthRef = useRef(false);

    // ── Login / Logout ──
    useEffect(() => {
        const wasAuth = prevAuthRef.current;
        prevAuthRef.current = isAuthenticated;

        // Logout: auth → guest
        if (wasAuth && !isAuthenticated) {
            mergedRef.current = false;
            const { isGuest, setIsGuest } = useCartStore.getState();
            if (!isGuest) setIsGuest(true);
            return;
        }

        // Login: guest → auth (merge один раз)
        if (!isAuthenticated || mergedRef.current) return;
        mergedRef.current = true;

        const controller = new AbortController();

        const run = async () => {
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

            if (!isGuest) {
                // Уже залогинен (перезагрузка) — подтягиваем серверную корзину
                // чтобы увидеть изменения с других устройств
                try {
                    const header = authHeaderRef.current;
                    if (header) {
                        const serverCart = await apiClient<TBackendCartState>('/cart', {
                            auth: header,
                        });
                        if (controller.signal.aborted) return;
                        const serverItems = fromBackendCartState(serverCart);
                        if (Object.keys(serverItems).length > 0) {
                            skipNextSyncRef.current = true;
                            replaceItems(serverItems);
                        }
                    }
                } catch {
                    // Сервер недоступен — работаем с localStorage
                }
                return;
            }

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
                const header = authHeaderRef.current;
                if (header) {
                    postCart(merged, header)
                        .then(() =>
                            queryClientRef.current.invalidateQueries({ queryKey: CART_QUERY_KEY }),
                        )
                        .catch(() => {});
                }
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

    // ── SWR: TanStack Query refetch на фокус/resume → обновить store ──
    // refetchOnWindowFocus (дефолт TQ) подтягивает свежие данные при:
    // - переключении вкладок, PWA resume, alt-tab
    const isGuest = useCartStore((s) => s.isGuest);

    const { data: serverCart, dataUpdatedAt } = useCart({
        enabled: isAuthenticated && !isGuest,
    });

    useEffect(() => {
        if (!serverCart || !dataUpdatedAt) return;
        // Не обновляем store если есть pending локальные изменения
        if (pendingTimer) return;

        const serverItems = fromBackendCartState(serverCart);
        const localItems = useCartStore.getState().items;

        if (!hasCartDiff(localItems, serverItems)) return;

        skipNextSyncRef.current = true;
        useCartStore.getState().replaceItems(serverItems);
    }, [serverCart, dataUpdatedAt]);

    // ── Debounce sync: store → POST /cart ──
    useEffect(() => {
        const unsubscribe = useCartStore.subscribe((state, prevState) => {
            if (state.isGuest) return;
            if (state.items === prevState.items) return;

            if (skipNextSyncRef.current) {
                skipNextSyncRef.current = false;
                return;
            }

            // Захватываем auth СЕЙЧАС из store (синхронно, пока токен жив)
            // TODO: для miniapp (Telegram/MAX) читать из platform adapter
            const token = useAuthStore.getState().accessToken;
            pendingAuth = token ? `Bearer ${token}` : null;

            if (pendingTimer) clearTimeout(pendingTimer);

            pendingTimer = setTimeout(() => {
                const auth = pendingAuth;
                if (!auth) return;
                postCart(state.items, auth)
                    .then(() =>
                        queryClientRef.current.invalidateQueries({ queryKey: CART_QUERY_KEY }),
                    )
                    .catch(() => {});
                pendingAuth = null;
                pendingTimer = null;
            }, DEBOUNCE_MS);
        });

        return () => {
            unsubscribe();
            if (pendingTimer) clearTimeout(pendingTimer);
        };
    }, []);
}
