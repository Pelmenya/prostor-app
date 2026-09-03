'use client';

import { useEffect, useState } from 'react';

/**
 * Client-side throttle tracker для slovo /catalog/search (limit 10/min/IPv6-/64).
 *
 * Backend не возвращает `X-RateLimit-Remaining` headers — клиент считает сам.
 * Хранится rolling-window массив timestamps в module scope (shared между всеми
 * mount'ами useSmartSearch — корректно для single-tab user; кросс-tab synced
 * через storage event см. TODO ниже если понадобится).
 *
 * Использование: вызвать `recordSearchRequest()` в mutation onMutate/onSuccess.
 * UI: `useThrottleRemaining()` возвращает remaining count + tick на изменение.
 * Slovo design uplift 2026-05-18 vote: hide unless <3 left (показывать chip
 * только в warning state).
 */

const LIMIT = 10;
const WINDOW_MS = 60_000;

let timestamps: number[] = [];
const subscribers = new Set<() => void>();

function gc(now: number) {
    const cutoff = now - WINDOW_MS;
    timestamps = timestamps.filter((t) => t > cutoff);
}

function notify() {
    subscribers.forEach((cb) => cb());
}

export function recordSearchRequest() {
    const now = Date.now();
    gc(now);
    timestamps.push(now);
    notify();
}

export function getRemainingNow(): number {
    gc(Date.now());
    return Math.max(0, LIMIT - timestamps.length);
}

/**
 * @returns remaining requests in current 60s window (0..10).
 *   Re-renders каждую секунду чтобы счётчик «таял» по мере истечения timestamps.
 */
export function useThrottleRemaining(): number {
    const [, force] = useState(0);

    useEffect(() => {
        const cb = () => force((x) => x + 1);
        subscribers.add(cb);
        const interval = setInterval(cb, 1000);
        return () => {
            subscribers.delete(cb);
            clearInterval(interval);
        };
    }, []);

    return getRemainingNow();
}
