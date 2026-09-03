'use client';

import { useSyncExternalStore } from 'react';

const NOOP_SUBSCRIBE = () => () => {};

export function useIsClient(): boolean {
    return useSyncExternalStore(
        NOOP_SUBSCRIBE,
        () => true,
        () => false,
    );
}
