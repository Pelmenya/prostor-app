'use client';

import { create } from 'zustand';

/**
 * Источник координат для EquipmentModal.
 *  - `pin` — пин клиента (геолокация / manual). Open через FAB.
 *  - `cell` — выбранная cell на карте. Open через cell-popup CTA.
 *
 * Семантически разные сценарии — отражаем через `source` чтобы UI рендерил
 * differentiated copy («По вашему адресу» vs «По выбранной зоне»).
 *
 * Transient — не персистится. Сбрасывается при close модалки.
 */
export type TEquipmentSource = {
    lat: number;
    lon: number;
    source: 'pin' | 'cell';
    /** Опциональный label для display («Раменское» / «эта зона»). */
    label?: string;
};

export type TEquipmentSourceStore = {
    source: TEquipmentSource | null;
    setSource: (s: TEquipmentSource | null) => void;
};

export const useEquipmentSourceStore = create<TEquipmentSourceStore>((set) => ({
    source: null,
    setSource: (s) => set({ source: s }),
}));
