'use client';

import { createContext, useEffect, useState } from 'react';
import type { TMessengerAdapter } from './types';
import { detectPlatform } from './utils/detect-platform';
import { createMessengerAdapter } from './factory';

export const MessengerContext = createContext<TMessengerAdapter | null>(null);

type TMessengerProviderProps = {
    children: React.ReactNode;
};

export function MessengerProvider({ children }: TMessengerProviderProps) {
    const [adapter, setAdapter] = useState<TMessengerAdapter | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const platform = detectPlatform();
        const messengerAdapter = createMessengerAdapter(platform);

        messengerAdapter
            .init()
            .then(() => {
                setAdapter(messengerAdapter);
            })
            .catch((err: unknown) => {
                setError(err instanceof Error ? err : new Error(String(err)));
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="alert alert-error">
                    <span>Ошибка инициализации: {error.message}</span>
                </div>
            </div>
        );
    }

    return <MessengerContext.Provider value={adapter}>{children}</MessengerContext.Provider>;
}
