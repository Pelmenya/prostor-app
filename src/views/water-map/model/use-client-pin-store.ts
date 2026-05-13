'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Координаты клиента — пин на карте. Источник:
 *   1. Явный ввод (button «Поставить пин здесь»).
 *   2. Геолокация браузера (`navigator.geolocation`).
 *   3. real-estate юзера — выбран из списка объектов (multi-pin).
 *
 * Persist в localStorage чтобы юзер не вводил адрес повторно. SWR-pattern:
 * если бэк позже скажет «у тебя real-estate в Реутове» — обновим без потери
 * локального ручного выбора.
 *
 * `realEstateId` — заполнен только когда source='real-estate'. Используется
 * stores layer для запроса useNearestRetailStores({realEstateId}).
 * При смене pin на geolocation/manual — id обнуляется.
 */
export type TClientPin = {
    lat: number;
    lon: number;
    source: 'manual' | 'geolocation' | 'real-estate';
    /** Display label (адрес / «Текущее местоположение» / название объекта). */
    label?: string;
    /** id выбранного real-estate (только если source='real-estate'). */
    realEstateId?: number;
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
