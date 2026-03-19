'use client';

import { createContext, useEffect, useState } from 'react';
import type { TPlatformAdapter } from './types';
import { detectPlatform } from './utils/detect-platform';
import { createPlatformAdapter } from './factory';

export const PlatformContext = createContext<TPlatformAdapter | null>(null);

type TPlatformProviderProps = {
    children: React.ReactNode;
};

export function PlatformProvider({ children }: TPlatformProviderProps) {
    const [adapter, setAdapter] = useState<TPlatformAdapter | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const platform = detectPlatform();
        const platformAdapter = createPlatformAdapter(platform);

        platformAdapter
            .init()
            .then(() => {
                setAdapter(platformAdapter);
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

    return <PlatformContext.Provider value={adapter}>{children}</PlatformContext.Provider>;
}
