'use client';

import { usePushNotifications } from '../lib/use-push-notifications';
import { pushTest } from '../api/push-api';

export function PushToggle() {
    const { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe } =
        usePushNotifications();

    if (!isSupported) {
        return null;
    }

    if (permission === 'denied') {
        return <p className="text-xs text-error">Пуши заблокированы</p>;
    }

    async function handleTest() {
        try {
            await pushTest();
        } catch (err) {
            console.error('[PushToggle] test error:', err);
        }
    }

    return (
        <div className="flex items-center gap-2">
            <input
                type="checkbox"
                className="toggle toggle-primary toggle-xs"
                checked={isSubscribed}
                disabled={isLoading}
                onChange={isSubscribed ? unsubscribe : subscribe}
            />
            <button
                type="button"
                className="btn btn-outline btn-xs btn-primary"
                onClick={handleTest}
                disabled={isLoading || !isSubscribed}
            >
                🔔
            </button>
        </div>
    );
}
