'use client';

import { usePushNotifications } from '../lib/use-push-notifications';
import { pushTest, pushBroadcast } from '../api/push.api';

const IS_DEV = process.env.NODE_ENV === 'development';

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
        <div className="flex items-center gap-2">
            <input
                type="checkbox"
                className="toggle toggle-primary toggle-xs"
                checked={isSubscribed}
                disabled={isLoading}
                onChange={isSubscribed ? unsubscribe : subscribe}
            />
            {IS_DEV && isSubscribed && (
                <>
                    <button
                        type="button"
                        className="btn btn-outline btn-xs btn-primary"
                        onClick={() => pushTest().catch(console.error)}
                    >
                        🔔
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline btn-xs btn-secondary"
                        onClick={() =>
                            pushBroadcast('PROSTOR', 'Тестовая рассылка').catch(console.error)
                        }
                    >
                        📢
                    </button>
                </>
            )}
        </div>
    );
}
