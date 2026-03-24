'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/shared/lib/auth';
import { urlBase64ToUint8Array } from './vapid-key';
import { pushSubscribe, pushUnsubscribe, pushStatus } from '../api/push.api';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

const IS_SUPPORTED =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

type TPushState = {
    permission: NotificationPermission;
    isSubscribed: boolean;
    isLoading: boolean;
};

export function usePushNotifications() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    const [state, setState] = useState<TPushState>({
        permission: IS_SUPPORTED ? Notification.permission : 'default',
        isSubscribed: false,
        isLoading: IS_SUPPORTED && isAuthenticated,
    });

    async function subscribe() {
        if (!VAPID_PUBLIC_KEY) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY не задан в .env.local');
            }
            return;
        }

        setState((prev) => ({ ...prev, isLoading: true }));

        try {
            const perm = await Notification.requestPermission();
            setState((prev) => ({ ...prev, permission: perm }));

            if (perm !== 'granted') {
                setState((prev) => ({ ...prev, isLoading: false }));
                return;
            }

            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
            });

            const json = sub.toJSON();

            if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
                throw new Error('Invalid push subscription: missing required fields');
            }

            await pushSubscribe({
                endpoint: json.endpoint,
                keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
            });

            setState((prev) => ({ ...prev, isSubscribed: true, isLoading: false }));
        } catch (err) {
            console.error('[Push] subscribe error:', err);
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    }

    async function unsubscribe() {
        setState((prev) => ({ ...prev, isLoading: true }));

        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();

            if (sub) {
                await pushUnsubscribe(sub.endpoint);
                await sub.unsubscribe();
            }

            setState((prev) => ({ ...prev, isSubscribed: false, isLoading: false }));
        } catch {
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    }

    useEffect(() => {
        if (!IS_SUPPORTED || !isAuthenticated) return;

        let cancelled = false;

        navigator.serviceWorker
            .getRegistration()
            .then((reg) => {
                if (!reg) return { browserSub: null, serverStatus: { isSubscribed: false } };
                return Promise.all([
                    reg.pushManager.getSubscription(),
                    pushStatus().catch(() => ({ isSubscribed: false })),
                ]).then(([browserSub, serverStatus]) => ({ browserSub, serverStatus }));
            })
            .then(({ browserSub, serverStatus }) => {
                if (!cancelled) {
                    setState((prev) => ({
                        ...prev,
                        isSubscribed: !!browserSub && serverStatus.isSubscribed,
                        isLoading: false,
                    }));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setState((prev) => ({ ...prev, isLoading: false }));
                }
            });

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated]);

    return {
        isSupported: IS_SUPPORTED,
        ...state,
        subscribe,
        unsubscribe,
    };
}
