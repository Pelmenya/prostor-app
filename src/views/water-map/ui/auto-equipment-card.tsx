'use client';

import { useSyncExternalStore } from 'react';
import { ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useClientPinStore, useEquipmentSourceStore, useWaterMapStore } from '../model';
import { useEquipmentSuggest } from '../lib';

const DISMISS_KEY = 'water-map:auto-equipment-dismissed';

/**
 * Floating card снизу карты — показывает результат фонового запроса
 * /equipment-suggest сразу после установки pin'а. Не блокирует UI,
 * на тап → открывает полную equipment-modal.
 *
 * dismissed-state хранится в localStorage с ключом = координаты pin'а
 * (toFixed(4) ≈ 11м точность). Подписка через useSyncExternalStore →
 * pin сменился (другой ключ) ⇒ snapshot изменился ⇒ перерисовка.
 * Без `setState` в `useEffect` (React 19 правило).
 */

const STORAGE_SUBSCRIBERS = new Set<() => void>();
let storageHandler: ((e: StorageEvent) => void) | null = null;

function ensureStorageHandler(): void {
    if (storageHandler || typeof window === 'undefined') return;
    storageHandler = (e: StorageEvent) => {
        if (e.key === DISMISS_KEY) {
            for (const cb of STORAGE_SUBSCRIBERS) cb();
        }
    };
    window.addEventListener('storage', storageHandler);
}

function subscribeStorage(cb: () => void): () => void {
    ensureStorageHandler();
    STORAGE_SUBSCRIBERS.add(cb);
    return () => {
        STORAGE_SUBSCRIBERS.delete(cb);
        if (STORAGE_SUBSCRIBERS.size === 0 && storageHandler) {
            window.removeEventListener('storage', storageHandler);
            storageHandler = null;
        }
    };
}

function readDismissedKey(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(DISMISS_KEY);
}

function readDismissedKeyServer(): string | null {
    return null;
}

function pinKey(pin: { lat: number; lon: number } | null): string | null {
    if (!pin) return null;
    return `${pin.lat.toFixed(4)},${pin.lon.toFixed(4)}`;
}

export function AutoEquipmentCard() {
    const pin = useClientPinStore((s) => s.pin);
    const setEquipmentOpen = useWaterMapStore((s) => s.setEquipmentOpen);
    const equipmentOpen = useWaterMapStore((s) => s.equipmentOpen);
    const setEquipmentSource = useEquipmentSourceStore((s) => s.setSource);

    // Derive dismissed reactive: localStorage snapshot vs текущий pin-key.
    // При смене pin — pinKey изменится, snapshot в localStorage останется
    // прежним (другой), результат сравнения автоматически станет false.
    const dismissedKey = useSyncExternalStore(
        subscribeStorage,
        readDismissedKey,
        readDismissedKeyServer,
    );
    const currentKey = pinKey(pin);
    const dismissed = !!currentKey && dismissedKey === currentKey;

    const handleOpen = () => {
        if (!pin) return;
        setEquipmentSource({ lat: pin.lat, lon: pin.lon, source: 'pin', label: pin.label });
        setEquipmentOpen(true);
    };

    const body = pin ? { lat: pin.lat, lon: pin.lon, topK: 5 } : null;
    const { data, isLoading } = useEquipmentSuggest(body);

    const handleDismiss = () => {
        if (!currentKey) return;
        localStorage.setItem(DISMISS_KEY, currentKey);
        // storage event внутри той же вкладки не срабатывает —
        // принудительно нотифицируем подписчиков.
        for (const cb of STORAGE_SUBSCRIBERS) cb();
    };

    if (!pin || dismissed || equipmentOpen || isLoading) return null;
    if (!data || data.insufficientData || data.problems.length === 0) return null;

    return (
        <div
            className="pointer-events-auto absolute left-2 right-2 z-10 rounded-xl bg-primary text-primary-content shadow-lg p-3 flex items-center gap-3 lg:left-[376px] lg:right-auto lg:max-w-md"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0) + 5.5rem)' }}
        >
            <button
                type="button"
                onClick={handleOpen}
                className="flex-1 text-left flex items-center gap-3 cursor-pointer"
            >
                <div className="size-9 rounded-full bg-primary-content/20 flex items-center justify-center shrink-0">
                    <span className="text-base font-bold">{data.problems.length}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight">
                        По вашему адресу{problemsTail(data.problems.length)}
                    </p>
                    <p className="text-xs opacity-80 leading-tight mt-0.5">
                        {data.recommendations.length} {recsTail(data.recommendations.length)} — тап
                        для деталей
                    </p>
                </div>
                <ChevronRightIcon className="size-5 shrink-0 opacity-80" />
            </button>
            <button
                type="button"
                onClick={handleDismiss}
                aria-label="Скрыть"
                className="rounded-full p-1 hover:bg-primary-content/20 shrink-0"
            >
                <XMarkIcon className="size-4" />
            </button>
        </div>
    );
}

function problemsTail(n: number): string {
    if (n === 1) return ': 1 проблема';
    if (n >= 2 && n <= 4) return `: ${n} проблемы`;
    return `: ${n} проблем`;
}

function recsTail(n: number): string {
    if (n === 1) return 'рекомендация';
    if (n >= 2 && n <= 4) return 'рекомендации';
    return 'рекомендаций';
}
