'use client';

import { usePushNotifications } from '../lib/use-push-notifications';

export function PushToggle() {
    const { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe } =
        usePushNotifications();

    if (!isSupported) {
        return null;
    }

    if (permission === 'denied') {
        return <p className="text-xs text-error">Пуши заблокированы</p>;
    }

    return (
        <input
            type="checkbox"
            className="toggle toggle-primary toggle-xs"
            checked={isSubscribed}
            disabled={isLoading}
            onChange={isSubscribed ? unsubscribe : subscribe}
        />
    );
}
