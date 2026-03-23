'use client';

import { usePushNotifications } from '../lib/use-push-notifications';
import { pushTest } from '../api/push-api';
import { useAuthStore } from '@/shared/lib/auth';

export function PushToggle() {
    const { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe } =
        usePushNotifications();
    const accessToken = useAuthStore((s) => s.accessToken);

    if (!isSupported) {
        return <p className="text-sm text-base-content/50">Push-уведомления не поддерживаются</p>;
    }

    if (permission === 'denied') {
        return (
            <p className="text-sm text-error">Уведомления заблокированы в настройках браузера</p>
        );
    }

    async function handleTest() {
        if (!accessToken) return;
        await pushTest(`Bearer ${accessToken}`);
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <span className="text-sm">Push-уведомления</span>
                <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm"
                    checked={isSubscribed}
                    disabled={isLoading}
                    onChange={isSubscribed ? unsubscribe : subscribe}
                />
            </div>

            {isSubscribed && (
                <button
                    type="button"
                    className="btn btn-outline btn-xs btn-primary w-fit"
                    onClick={handleTest}
                    disabled={isLoading}
                >
                    Тест
                </button>
            )}
        </div>
    );
}
