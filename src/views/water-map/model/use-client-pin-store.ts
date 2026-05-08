'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Координаты клиента — пин на карте. Источник:
 *   1. Явный ввод (button «Поставить пин здесь» по центру map при FTUX).
 *   2. Геолокация браузера (`navigator.geolocation`).
 *   3. real-estate.address при авторизованном клиенте (Phase 2 — пока пропускаем).
 *
 * Persist в localStorage чтобы юзер не вводил адрес повторно. SWR-pattern:
 * если бэк позже скажет «у тебя real-estate в Реутове» — обновим без потери
 * локального ручного выбора (pendingChanges branch).
 */
export type TClientPin = {
    lat: number;
    lon: number;
    /** Источник для UX-debug: «локация браузера», «вручную», «адрес». */
    source: 'manual' | 'geolocation' | 'real-estate';
    /** Display label (адрес/«Текущее местоположение»). Опционально. */
    label?: string;
};

export type TClientPinStore = {
    pin: TClientPin | null;
    setPin: (pin: TClientPin | null) => void;
};

export const useClientPinStore = create<TClientPinStore>()(
    persist(
        (set) => ({
            pin: null,
            setPin: (pin) => set({ pin }),
        }),
        { name: 'water-map:client-pin' },
    ),
);
