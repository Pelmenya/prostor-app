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

type TProps = {
    /** LayerPanel open state — на lg сдвигает bar за sidebar при open */
    layersOpen?: boolean;
};

export function AutoEquipmentCard({ layersOpen }: TProps = {}) {
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
            className={`pointer-events-auto absolute left-4 z-10 transition-[left] duration-300 ease-out ${
                layersOpen ? 'lg:left-[24rem]' : 'lg:left-4'
            }`}
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0) + 5.5rem)' }}
        >
            {/* Slim bar (design uplift 2026-05-18 Artifact 3): компактный pill
                с counter slot слева + краткая summary + chevron right. Не съедает
                viewport центр heatmap. */}
            <div className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-content shadow-md pl-1.5 pr-1 py-1 max-w-full">
                <button
                    type="button"
                    onClick={handleOpen}
                    className="flex items-center gap-2 min-w-0 cursor-pointer"
                >
                    {/* Counter slot — min-w-9 tabular-nums против CLS при pin drag
                        на адрес с другим issue count (slovo iter3 vote 16:40 #2). */}
                    <span className="size-7 min-w-9 rounded-full bg-primary-content/20 flex items-center justify-center shrink-0 text-xs font-bold tabular-nums">
                        {data.problems.length}
                    </span>
                    <span className="text-xs font-medium leading-tight whitespace-nowrap">
                        {data.recommendations.length} {recsTail(data.recommendations.length)}
                    </span>
                    <ChevronRightIcon className="size-4 shrink-0 opacity-80" />
                </button>
                {/* Touch area 44px (min-w-11/min-h-11) — visually pill stays 28px,
                    но -m-2 расширяет hitbox без визуального сдвига. WCAG 2.5.5 +
                    P2.8 правило (44px touch). */}
                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Скрыть"
                    className="size-7 min-w-11 min-h-11 -m-2 rounded-full flex items-center justify-center hover:bg-primary-content/20 shrink-0"
                >
                    <XMarkIcon className="size-3.5" />
                </button>
            </div>
        </div>
    );
}

function recsTail(n: number): string {
    if (n === 1) return 'рекомендация';
    if (n >= 2 && n <= 4) return 'рекомендации';
    return 'рекомендаций';
}
