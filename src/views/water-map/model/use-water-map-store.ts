'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TIntakeType, TWaterParam } from '@/entities/water-analysis';

/**
 * Какие layer'ы видны на карте. По дефолту heatmap=on (главная фича).
 * Aggregated layers по умолчанию off (см. прототип «Слой выкл...») — чтобы
 * не перегружать первый просмотр.
 */
export type TWaterMapLayer = 'heatmap' | 'depthMap' | 'points';

/**
 * Режим отрисовки cells — управляет stacked layers:
 *  - `spline` — только heatmap (smooth blobs, демо-режим без click)
 *  - `dots` — только circle dots (analytical, точные клики)
 *  - `both` — оба слоя одновременно (default, рекомендованный)
 *
 * Persistance в localStorage — выбор юзера запоминается между сессиями.
 */
export type TCellsViewMode = 'spline' | 'dots' | 'both';

export type TWaterMapStore = {
    /** Текущий paramCode для heatmap. Default — синтетический risk. */
    selectedParam: TWaterParam;
    setSelectedParam: (p: TWaterParam) => void;

    /** Какие layer'ы активны (toggle bottom-sheet/sidebar). */
    activeLayers: Set<TWaterMapLayer>;
    toggleLayer: (l: TWaterMapLayer) => void;
    setLayer: (l: TWaterMapLayer, on: boolean) => void;

    /** Выбранная heatmap-ячейка (для popup'а). null = popup закрыт. */
    selectedCellCoords: [number, number] | null;
    setSelectedCellCoords: (c: [number, number] | null) => void;

    /** Toggle «Похожие анализы рядом» (radius circle от пина клиента). */
    similarOn: boolean;
    similarRadiusKm: number;
    setSimilarOn: (on: boolean) => void;
    setSimilarRadiusKm: (km: number) => void;

    /** Filter intakeType для drilling-layers. */
    intakeType: TIntakeType;
    setIntakeType: (t: TIntakeType) => void;

    /** Режим отрисовки cells (spline/dots/both). */
    cellsViewMode: TCellsViewMode;
    setCellsViewMode: (m: TCellsViewMode) => void;

    /** Открыты ли модалки. Для UI без локальных useState. */
    predictOpen: boolean;
    equipmentOpen: boolean;
    aquiferStatsOpen: boolean;
    depthPredictOpen: boolean;
    setPredictOpen: (v: boolean) => void;
    setEquipmentOpen: (v: boolean) => void;
    setAquiferStatsOpen: (v: boolean) => void;
    setDepthPredictOpen: (v: boolean) => void;
};

/**
 * Только `cellsViewMode` персистится — это user preference. Остальное —
 * transient session state (selectedParam, layers, modals): persist'ить
 * было бы плохо, юзер ожидает «свежий старт» при заходе на /water.
 */
export const useWaterMapStore = create<TWaterMapStore>()(
    persist(
        (set) => ({
            selectedParam: 'risk',
            setSelectedParam: (p) => set({ selectedParam: p }),

            activeLayers: new Set<TWaterMapLayer>(['heatmap']),
            toggleLayer: (l) =>
                set((s) => {
                    const next = new Set(s.activeLayers);
                    if (next.has(l)) next.delete(l);
                    else next.add(l);
                    return { activeLayers: next };
                }),
            setLayer: (l, on) =>
                set((s) => {
                    const next = new Set(s.activeLayers);
                    if (on) next.add(l);
                    else next.delete(l);
                    return { activeLayers: next };
                }),

            selectedCellCoords: null,
            setSelectedCellCoords: (c) => set({ selectedCellCoords: c }),

            similarOn: false,
            similarRadiusKm: 10,
            setSimilarOn: (on) => set({ similarOn: on }),
            setSimilarRadiusKm: (km) => set({ similarRadiusKm: km }),

            intakeType: 'all',
            setIntakeType: (t) => set({ intakeType: t }),

            cellsViewMode: 'both',
            setCellsViewMode: (m) => set({ cellsViewMode: m }),

            predictOpen: false,
            equipmentOpen: false,
            aquiferStatsOpen: false,
            depthPredictOpen: false,
            setPredictOpen: (v) => set({ predictOpen: v }),
            setEquipmentOpen: (v) => set({ equipmentOpen: v }),
            setAquiferStatsOpen: (v) => set({ aquiferStatsOpen: v }),
            setDepthPredictOpen: (v) => set({ depthPredictOpen: v }),
        }),
        {
            name: 'water-map:store',
            // Persist только preference'ы — transient state не сохраняем.
            partialize: (s) => ({ cellsViewMode: s.cellsViewMode }) as Partial<TWaterMapStore>,
        },
    ),
);
