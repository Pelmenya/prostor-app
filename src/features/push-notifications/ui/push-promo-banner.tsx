'use client';

import { useState, useSyncExternalStore } from 'react';
import { usePushNotifications } from '../lib/use-push-notifications';
import { detectPwa } from '../lib/detect-pwa';

export function PushPromoBanner() {
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );
    const { isSubscribed, isLoading, isSupported, subscribe } = usePushNotifications();
    const { isIos, showInstallHint } = detectPwa();
    const [dismissed, setDismissed] = useState(false);

    if (!mounted || dismissed || isSubscribed) return null;

    // iOS но не PWA — показать инструкцию установки
    if (showInstallHint) {
        return (
            <div className="alert alert-info shadow-sm mx-4 mt-4">
                <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Установите приложение PROSTOR</span>
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => setDismissed(true)}
                        >
                            ✕
                        </button>
                    </div>
                    <p className="text-xs opacity-80">
                        Чтобы получать уведомления о заказах и замене картриджей:
                    </p>
                    <ol className="text-xs opacity-80 list-decimal ml-4 space-y-1">
                        <li>
                            Нажмите{' '}
                            <span className="inline-flex items-center">
                                <svg
                                    className="size-4 inline"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z" />
                                </svg>
                            </span>{' '}
                            внизу экрана Safari
                        </li>
                        <li>Выберите «На экран Домой»</li>
                        <li>Откройте приложение с домашнего экрана</li>
                        <li>Включите уведомления в настройках</li>
                    </ol>
                </div>
            </div>
        );
    }

    // Поддерживается, но не подписан — предложить подписаться
    if (isSupported) {
        return (
            <div className="alert alert-info shadow-sm mx-4 mt-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm">Включите уведомления</span>
                        <p className="text-xs opacity-80">
                            {isIos
                                ? 'Узнавайте о статусе заказов и замене картриджей'
                                : 'Статус заказов, напоминания о замене картриджей'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={subscribe}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="loading loading-spinner loading-xs" />
                            ) : (
                                'Включить'
                            )}
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => setDismissed(true)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
