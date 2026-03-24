'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/shared/lib/auth';
import { urlBase64ToUint8Array } from './vapid-key';
import { pushSubscribe, pushUnsubscribe, pushStatus } from '../api/push-api';

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
        if (!VAPID_PUBLIC_KEY) return;

        setState((prev) => ({ ...prev, isLoading: true }));

        try {
            const perm = await Notification.requestPermission();
            setState((prev) => ({ ...prev, permission: perm }));

            if (perm !== 'granted') {
                setState((prev) => ({ ...prev, isLoading: false }));
                return;
            }

            const reg = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
            });

            const json = sub.toJSON();

            await pushSubscribe({
                endpoint: json.endpoint!,
                keys: json.keys as { p256dh: string; auth: string },
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

        // Проверяем подписку в браузере, а не на бэкенде —
        // на другом устройстве может быть подписка, но здесь нет
        navigator.serviceWorker.ready
            .then((reg) => reg.pushManager.getSubscription())
            .then((sub) => {
                if (!cancelled) {
                    setState((prev) => ({
                        ...prev,
                        isSubscribed: !!sub,
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
